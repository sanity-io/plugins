// @vitest-environment node
import {Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'
import {createActor, fromCallback, type EventObject, fromPromise, SimulatedClock} from 'xstate'

import {assetItem, imageAsset, tag} from '../__tests__/fixtures/documents'
import {createMediaFetchMock, type MediaFixtures} from '../__tests__/fixtures/mediaFetchMock'
import {createMockSanityClient, mockPatchChain} from '../__tests__/fixtures/mockSanityClient'
import {inputs} from '../config/searchFacets'
import type {SearchFacetInputSearchableProps} from '../types'
import {
  assetEditDialog,
  folderCreateDialog,
  replaceAssetDialog,
  tagCreateDialog,
  tagEditDialog,
} from './dialogs'
import {type MediaInput, mediaMachine, type MediaMode} from './mediaMachine'
import {type UploadInput, uploadsMachine} from './uploadsMachine'

type ListenedQuery = {query: string; subject: Subject<unknown>}

function startMedia({
  fixtures = {},
  input,
  mode = {type: 'browser', mediaTagNames: []},
}: {
  fixtures?: MediaFixtures
  input?: Partial<MediaInput>
  mode?: MediaMode
} = {}) {
  const clock = new SimulatedClock()
  const listened: ListenedQuery[] = []
  const client = createMockSanityClient({
    fetch: createMediaFetchMock(fixtures),
    listen: vi.fn((query: string) => {
      const subject = new Subject<unknown>()
      listened.push({query, subject})
      return subject
    }),
  })
  const notify = vi.fn()
  const close = vi.fn()

  const actor = createActor(
    mediaMachine.provide({
      actions: {close, notify: (_, notification) => notify(notification)},
      actors: {
        // Hashing and uploading need browser APIs: upload instantly instead
        uploads: uploadsMachine.provide({
          actors: {
            'hash file': fromPromise(({input: {file}}) => Promise.resolve(`${file.name}-hash`)),
            'upload asset': fromCallback<EventObject, UploadInput>(
              ({input: {upload}, sendBack}) => {
                sendBack({
                  type: 'upload.complete',
                  asset: imageAsset(upload.name, {sha1hash: upload.hash}),
                  hash: upload.hash,
                })
              },
            ),
          },
        }),
      },
    }),
    {
      clock,
      input: {
        assetTypes: ['file', 'image'],
        client,
        excludeTagSlugs: [],
        mode,
        selectedAssetIds: [],
        showMediaLibraryAssets: true,
        ...input,
      },
    },
  ).start()

  const {assets, dialogs, folders, tags, uploads} = actor.getSnapshot().context
  const listenerFor = (documentType: string) => {
    const listener = listened.find(({query}) => query.includes(documentType))
    if (!listener) {
      throw new Error(`Nothing listens to ${documentType}`)
    }
    return listener.subject
  }
  const fetchedQueries = () => client.fetch.mock.calls.map(([query]) => String(query))

  return {
    actor,
    assets,
    client,
    clock,
    close,
    dialogs,
    fetchedQueries,
    folders,
    listened,
    listenerFor,
    notify,
    tags,
    uploads,
  }
}

type MediaHarness = ReturnType<typeof startMedia>

const waitForLoaded = ({assets, folders, tags}: MediaHarness) =>
  vi.waitFor(() => {
    expect(assets.getSnapshot().context.fetchCount).toBeGreaterThanOrEqual(0)
    expect(assets.getSnapshot().matches({fetch: 'idle'})).toBe(true)
    expect(folders.getSnapshot().context.fetchCount).toBeGreaterThanOrEqual(0)
    expect(tags.getSnapshot().context.fetchCount).toBeGreaterThanOrEqual(0)
  })

async function startLoadedMedia(options: Parameters<typeof startMedia>[0] = {}) {
  const harness = startMedia(options)
  await waitForLoaded(harness)
  harness.client.fetch.mockClear()
  return harness
}

const product = tag('t1', 'product')

describe(mediaMachine.id, () => {
  describe('browsing', () => {
    it('loads tags, folders and assets, and listens to realtime changes until stopped', async () => {
      const harness = startMedia({fixtures: {assets: [imageAsset('a1')]}})
      await waitForLoaded(harness)

      expect(harness.fetchedQueries()).toEqual([
        expect.stringContaining('"media.tag"'),
        expect.stringContaining('"media.folder"'),
        expect.stringContaining('originalFilename'),
      ])
      expect(harness.assets.getSnapshot().context.allIds).toEqual(['a1'])
      expect(harness.listened.map(({query}) => query)).toEqual([
        expect.stringContaining('"sanity.imageAsset"'),
        expect.stringContaining('"media.tag"'),
        expect.stringContaining('"media.folder"'),
      ])

      harness.actor.stop()
      expect(harness.listened.every(({subject}) => !subject.observed)).toBe(true)
    })

    it('hands realtime changes to the actors owning them', async () => {
      const harness = await startLoadedMedia({fixtures: {assets: [imageAsset('a1')]}})

      harness.listenerFor('sanity.imageAsset').next({
        documentId: 'a1',
        result: imageAsset('a1', {title: 'Renamed'}),
        transition: 'update',
      })
      harness
        .listenerFor('media.tag')
        .next({documentId: 't1', result: product, transition: 'appear'})
      harness.listenerFor('media.folder').next({documentId: 'f1', transition: 'appear'})
      harness.clock.increment(2000)

      expect(harness.assets.getSnapshot().context.byIds['a1']?.asset.title).toBe('Renamed')
      expect(harness.tags.getSnapshot().context.allIds).toEqual(['t1'])
      expect(harness.fetchedQueries()).toEqual([expect.stringContaining('"media.folder"')])
    })

    it('filters by the media tags of the field once tags are loaded', async () => {
      const harness = startMedia({
        fixtures: {tags: [product]},
        mode: {type: 'browser', mediaTagNames: ['product', 'unknown']},
      })
      await waitForLoaded(harness)

      const assetFetches = harness
        .fetchedQueries()
        .filter((query) => query.includes('originalFilename'))
      expect(assetFetches).toEqual([expect.stringContaining(`references('t1')`)])
      expect(harness.assets.getSnapshot().context.searchFacets).toEqual([
        {
          ...inputs.tag,
          id: expect.any(String),
          operatorType: 'references',
          value: {label: 'product', value: 't1'},
        },
      ])
    })

    it('shows every asset when tags fail to load', async () => {
      const harness = startMedia({
        fixtures: {
          assets: [imageAsset('a1')],
          errors: {tags: {message: 'Tags unavailable', statusCode: 503}},
        },
        mode: {type: 'browser', mediaTagNames: ['product']},
      })

      await vi.waitFor(() => expect(harness.assets.getSnapshot().context.allIds).toEqual(['a1']))
      expect(harness.assets.getSnapshot().context.searchFacets).toEqual([])
      expect(harness.notify).toHaveBeenCalledExactlyOnceWith({
        status: 'error',
        title: 'An error occurred: Tags unavailable',
      })
    })

    it('uploads into the current folder, and lists uploads once verified', async () => {
      const harness = await startLoadedMedia({
        fixtures: {folders: [{_id: 'f1', name: 'Campaigns', parentId: null}]},
        input: {assetTypes: ['image']},
      })
      harness.assets.send({type: 'folder.open', folderId: 'f1'})
      await waitForLoaded(harness)

      harness.actor.send({type: 'uploads.add', files: [new File(['x'], 'photo.png')]})
      await vi.waitFor(() => expect(harness.uploads.getSnapshot().context.allIds).toHaveLength(1))

      expect(harness.uploads.getSnapshot().context.byIds['photo.png-hash']).toMatchObject({
        assetType: 'image',
        folderId: 'f1',
        status: 'complete',
      })
      harness.clock.increment(1000)
      await vi.waitFor(() => expect(harness.uploads.getSnapshot().context.allIds).toEqual([]))
      expect(harness.assets.getSnapshot().context.allIds).toEqual(['photo.png'])
    })
  })

  describe('editing an asset', () => {
    it('opens the edit dialog of the asset, and closes once it is dismissed', async () => {
      const harness = startMedia({
        fixtures: {assets: [imageAsset('a1')]},
        mode: {type: 'editAsset', assetId: 'a1'},
      })
      await waitForLoaded(harness)

      const assetFetch = harness.client.fetch.mock.calls.find(([query]) =>
        String(query).includes('originalFilename'),
      )
      expect(assetFetch?.[0]).toContain('_id == $assetId')
      expect(assetFetch?.[1]).toMatchObject({assetId: 'a1'})
      expect(harness.fetchedQueries()).toEqual(
        expect.arrayContaining([
          expect.stringContaining('"media.tag"'),
          expect.stringContaining('"media.folder"'),
        ]),
      )
      expect(harness.dialogs.getSnapshot().context.items).toEqual([assetEditDialog('a1')])
      expect(harness.listened).toEqual([])

      harness.dialogs.send({type: 'dialog.close', id: 'a1'})
      expect(harness.close).toHaveBeenCalledTimes(1)
    })

    it('closes right away when there is nothing to edit', () => {
      const harness = startMedia({mode: {type: 'editAsset', assetId: undefined}})

      expect(harness.close).toHaveBeenCalledTimes(1)
      expect(harness.client.fetch).not.toHaveBeenCalled()
    })
  })

  describe('notifications', () => {
    it('batches asset updates into one notification', async () => {
      const asset = imageAsset('a1')
      const harness = await startLoadedMedia({fixtures: {assets: [asset, imageAsset('a2')]}})
      harness.client.patch.mockImplementation((id: string) => mockPatchChain(imageAsset(id)))

      harness.assets.send({type: 'asset.update', asset, formData: {}})
      harness.assets.send({type: 'asset.update', asset: imageAsset('a2'), formData: {}})
      await vi.waitFor(() => expect(harness.assets.getSnapshot().context.mutations).toEqual([]))
      harness.clock.increment(1999)
      expect(harness.notify).not.toHaveBeenCalled()

      harness.clock.increment(1)
      expect(harness.notify).toHaveBeenCalledWith({status: 'info', title: '2 assets updated'})
    })

    it('describes failures', async () => {
      const harness = await startLoadedMedia()
      harness.client.fetch.mockRejectedValueOnce({message: 'Query timed out', statusCode: 504})

      harness.assets.send({type: 'load'})

      await vi.waitFor(() =>
        expect(harness.notify).toHaveBeenCalledWith({
          status: 'error',
          title: 'An error occurred: Query timed out',
        }),
      )
    })
  })

  describe('coordinating actors', () => {
    it('closes the dialog of a change once it is saved', async () => {
      const asset = imageAsset('a1')
      const harness = await startLoadedMedia({fixtures: {assets: [asset]}})
      harness.client.patch.mockReturnValue(mockPatchChain(asset))
      harness.dialogs.send({type: 'dialog.open', dialog: assetEditDialog('a1')})

      harness.assets.send({type: 'asset.update', asset, closeDialogId: 'a1', formData: {}})

      await vi.waitFor(() => expect(harness.dialogs.getSnapshot().context.items).toEqual([]))
    })

    it('shows the tag as busy while it is added to the assets confirmed in a dialog', async () => {
      const asset = imageAsset('a1')
      const harness = await startLoadedMedia({fixtures: {assets: [asset], tags: [product]}})

      harness.actor.send({type: 'assets.tag.add', assets: [assetItem(asset)], tag: product})
      expect(harness.tags.getSnapshot().context.byIds['t1']?.updating).toBe(true)

      await vi.waitFor(() =>
        expect(harness.tags.getSnapshot().context.byIds['t1']?.updating).toBe(false),
      )
      expect(harness.notify).toHaveBeenCalledWith({status: 'info', title: 'Tag added to 1 asset'})
    })

    it('refreshes folder counts after assets are deleted', async () => {
      const asset = imageAsset('a1')
      const harness = await startLoadedMedia({fixtures: {assets: [asset, imageAsset('a2')]}})

      harness.actor.send({type: 'assets.delete', assets: [asset]})
      await vi.waitFor(() =>
        expect(harness.notify).toHaveBeenCalledWith({status: 'info', title: '1 asset deleted'}),
      )
      harness.clock.increment(300)

      expect(harness.fetchedQueries()).toEqual([expect.stringContaining('"media.folder"')])
    })

    it('opens folders once they are created', async () => {
      const harness = await startLoadedMedia()
      harness.dialogs.send({type: 'dialog.open', dialog: folderCreateDialog(null)})

      harness.folders.send({type: 'folder.create', name: 'Campaigns', parentId: null})

      await vi.waitFor(() =>
        expect(harness.notify).toHaveBeenCalledWith({status: 'info', title: 'Folder created'}),
      )
      expect(harness.dialogs.getSnapshot().context.items).toEqual([])
      expect(harness.assets.getSnapshot().context.currentFolderId).toBe(
        harness.client.create.mock.lastCall?.[0]._id,
      )
    })

    it('leaves the current folder once it is deleted', async () => {
      const harness = await startLoadedMedia({
        fixtures: {folders: [{_id: 'f1', name: 'Campaigns', parentId: null}]},
      })
      harness.assets.send({type: 'folder.open', folderId: 'f1'})

      harness.actor.send({type: 'folder.delete', folderId: 'f1'})

      await vi.waitFor(() =>
        expect(harness.notify).toHaveBeenCalledWith({status: 'info', title: 'Folder deleted'}),
      )
      expect(harness.assets.getSnapshot().context.currentFolderId).toBeNull()
    })

    it('leaves the current folder when it is gone from the refreshed folders', async () => {
      const harness = await startLoadedMedia()
      harness.assets.send({type: 'folder.open', folderId: 'deleted-elsewhere'})

      harness.folders.send({type: 'fetch'})

      await vi.waitFor(() =>
        expect(harness.assets.getSnapshot().context.currentFolderId).toBeNull(),
      )
    })

    it('keeps tag filters in sync with renamed tags', async () => {
      const harness = await startLoadedMedia({fixtures: {tags: [product]}})
      harness.assets.send({
        type: 'search.facet.add',
        facet: {
          ...inputs.tag,
          value: {label: 'product', value: 't1'},
        } as SearchFacetInputSearchableProps,
      })
      harness.dialogs.send({type: 'dialog.open', dialog: tagEditDialog('t1')})
      harness.client.patch.mockReturnValue(mockPatchChain(tag('t1', 'products')))

      harness.tags.send({type: 'tag.update', closeDialogId: 't1', name: 'products', tag: product})

      await vi.waitFor(() =>
        expect(harness.notify).toHaveBeenCalledWith({status: 'info', title: 'Tag updated'}),
      )
      expect(harness.dialogs.getSnapshot().context.items).toEqual([])
      expect(harness.assets.getSnapshot().context.searchFacets[0]).toMatchObject({
        value: {label: 'products', value: 't1'},
      })
    })

    it('browses the whole library while the replace dialog is open', async () => {
      const harness = await startLoadedMedia({fixtures: {assets: [imageAsset('a1')]}})

      harness.dialogs.send({type: 'dialog.open', dialog: replaceAssetDialog('a1')})
      expect(harness.assets.getSnapshot().context.replace).toEqual({assetId: 'a1'})

      harness.dialogs.send({type: 'dialogs.clear'})
      expect(harness.assets.getSnapshot().context.replace).toBeUndefined()
    })

    it('clears errors from earlier attempts when create dialogs open again', async () => {
      const harness = await startLoadedMedia({fixtures: {tags: [product]}})
      harness.tags.send({type: 'tag.create', name: 'product'})
      harness.folders.send({type: 'folder.create', name: ' ', parentId: null})
      await vi.waitFor(() => {
        expect(harness.tags.getSnapshot().context.creatingError).toBeDefined()
        expect(harness.folders.getSnapshot().context.creatingError).toBeDefined()
      })

      harness.dialogs.send({type: 'dialog.open', dialog: tagCreateDialog()})
      harness.dialogs.send({type: 'dialog.open', dialog: folderCreateDialog(null)})

      expect(harness.tags.getSnapshot().context.creatingError).toBeUndefined()
      expect(harness.folders.getSnapshot().context.creatingError).toBeUndefined()
    })
  })
})

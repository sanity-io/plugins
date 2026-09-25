// @vitest-environment node
import {describe, expect, it, vi} from 'vitest'
import {createActor, SimulatedClock} from 'xstate'

import {
  assetItem,
  fileAsset,
  folderReference,
  imageAsset,
  tag,
  tagReference,
} from '../__tests__/fixtures/documents'
import {
  createMockSanityClient,
  deferred,
  mockPatchChain,
  mockTransaction,
} from '../__tests__/fixtures/mockSanityClient'
import {createTestParent} from '../__tests__/fixtures/testParent'
import {inputs} from '../config/searchFacets'
import type {Asset, SearchFacetInputSearchableProps} from '../types'
import {
  type AssetsActorRef,
  type AssetsInput,
  assetsMachine,
  type AssetsReport,
  selectPickedAssets,
  selectReplacementCandidateIds,
} from './assetsMachine'

function startAssetsActor({
  client = createMockSanityClient(),
  input,
}: {
  client?: ReturnType<typeof createMockSanityClient>
  input?: Partial<AssetsInput>
} = {}) {
  const clock = new SimulatedClock()
  const testParent = createTestParent<AssetsReport>({clock})
  const actor = createActor(assetsMachine, {
    input: {
      assetTypes: ['file', 'image'],
      client,
      documentAssetIds: [],
      excludeTagSlugs: [],
      showMediaLibraryAssets: true,
      ...input,
    },
    parent: testParent.parent,
  }).start()
  return {actor, client, clock, ...testParent}
}

const waitForFetch = (actor: AssetsActorRef) =>
  vi.waitFor(() => expect(actor.getSnapshot().matches({fetch: 'idle'})).toBe(true))

const waitForMutations = (actor: AssetsActorRef) =>
  vi.waitFor(() => {
    expect(actor.getSnapshot().matches({mutations: 'idle'})).toBe(true)
    expect(actor.getSnapshot().context.mutations).toEqual([])
  })

/** Starts an actor with `assets` loaded, answering further fetches with `assets` too. */
async function startWithAssets(assets: Asset[], input?: Partial<AssetsInput>) {
  const harness = startAssetsActor({
    client: createMockSanityClient({fetch: vi.fn(() => Promise.resolve(assets))}),
    ...(input ? {input} : {}),
  })
  harness.actor.send({type: 'load'})
  await waitForFetch(harness.actor)
  harness.client.fetch.mockClear()
  return harness
}

const lastFetch = (client: ReturnType<typeof createMockSanityClient>) => {
  const call = client.fetch.mock.lastCall
  if (!call) {
    throw new Error('Nothing was fetched')
  }
  return {options: call[2], params: call[1], query: String(call[0])}
}

describe(assetsMachine.id, () => {
  describe('loading', () => {
    it('fetches the first page of assets matching the browse query', async () => {
      const assets = [imageAsset('a1'), imageAsset('a2')]
      const {actor, client} = startAssetsActor({
        client: createMockSanityClient({fetch: vi.fn(() => Promise.resolve(assets))}),
        input: {assetTypes: ['image'], documentAssetIds: ['a1'], documentId: 'doc'},
      })

      actor.send({type: 'load'})
      expect(actor.getSnapshot().matches({fetch: 'fetching'})).toBe(true)
      await waitForFetch(actor)

      const {options, params, query} = lastFetch(client)
      expect(query).toContain('_type in ["sanity.imageAsset"]')
      expect(query).toContain('order(_createdAt desc) [0...100]')
      expect(params).toEqual({documentAssetIds: ['a1'], documentId: 'doc'})
      expect(options.signal).toBeInstanceOf(AbortSignal)
      expect(actor.getSnapshot().context).toMatchObject({
        allIds: ['a1', 'a2'],
        byIds: {a1: assetItem(assets[0]!), a2: assetItem(assets[1]!)},
        fetchCount: 2,
      })
    })

    it('restricts fetches to a single asset when given one', async () => {
      const {actor, client} = startAssetsActor({input: {assetId: 'a1'}})

      actor.send({type: 'load'})
      await waitForFetch(actor)

      const {params, query} = lastFetch(client)
      expect(query).toContain('&& _id == $assetId')
      expect(params).toMatchObject({assetId: 'a1'})
    })

    it('keeps the pick, updating and error state of refetched assets', async () => {
      const asset = imageAsset('a1')
      const {actor, client} = await startWithAssets([asset])
      actor.send({type: 'pick.toggle', assetId: 'a1'})
      client.patch.mockReturnValue(mockPatchChain(new Promise(() => undefined)))
      actor.send({type: 'asset.update', asset, formData: {}})

      const refetched = imageAsset('a1', {title: 'Refetched'})
      client.fetch.mockResolvedValueOnce([refetched])
      actor.send({type: 'load'})
      await waitForFetch(actor)

      expect(actor.getSnapshot().context.byIds['a1']).toEqual(
        assetItem(refetched, {picked: true, updating: true}),
      )
    })

    it('only applies the latest fetch when the query changes mid-fetch', async () => {
      const first = deferred<Asset[]>()
      const second = deferred<Asset[]>()
      const client = createMockSanityClient({
        fetch: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise),
      })
      const {actor} = startAssetsActor({client})

      actor.send({type: 'load'})
      const firstSignal: AbortSignal = client.fetch.mock.calls[0]![2].signal
      actor.send({type: 'order.set', order: {direction: 'asc', field: 'size'}})

      expect(firstSignal.aborted).toBe(true)
      first.resolve([imageAsset('stale')])
      second.resolve([imageAsset('fresh')])
      await waitForFetch(actor)

      expect(actor.getSnapshot().context.allIds).toEqual(['fresh'])
    })

    it('reports failed fetches and keeps the error until a fetch succeeds', async () => {
      const client = createMockSanityClient({
        fetch: vi.fn().mockRejectedValueOnce({message: 'boom', statusCode: 503}),
      })
      const {actor, events} = startAssetsActor({client})

      actor.send({type: 'load'})
      await waitForFetch(actor)

      expect(actor.getSnapshot().context.fetchingError).toEqual({message: 'boom', statusCode: 503})
      expect(events).toEqual([
        {type: 'assets.fetchFailed', error: {message: 'boom', statusCode: 503}},
      ])

      client.fetch.mockResolvedValueOnce([])
      actor.send({type: 'load'})
      await waitForFetch(actor)
      expect(actor.getSnapshot().context.fetchingError).toBeUndefined()
    })

    it('keeps mutations, upload checks and realtime batches going while the list reloads', async () => {
      const asset = imageAsset('a1')
      const {actor, client, clock, reported} = await startWithAssets([asset])
      client.fetch.mockImplementation((query: string) =>
        Promise.resolve(query.includes('$uploadedAssetIds') ? ['up-1'] : [asset]),
      )
      const update = deferred<Asset>()
      client.patch.mockReturnValue(mockPatchChain(update.promise))
      actor.send({type: 'asset.update', asset, formData: {}})
      actor.send({type: 'upload.completed', asset: imageAsset('up-1')})
      actor.send({type: 'listener.mutation', documentId: 'a1', result: asset, transition: 'update'})
      clock.increment(500)

      actor.send({type: 'load'})
      actor.send({type: 'folder.open', folderId: 'folder-1'})
      actor.send({type: 'search.query.set', query: 'cat'})
      clock.increment(500)

      expect(client.patch).toHaveBeenCalledTimes(1)
      expect(actor.getSnapshot().matches({mutations: 'updating'})).toBe(true)
      expect(client.fetch).toHaveBeenCalledWith(
        expect.stringContaining('$uploadedAssetIds'),
        expect.objectContaining({uploadedAssetIds: ['up-1']}),
        expect.anything(),
      )
      clock.increment(1000)
      expect(reported('assets.synced')).toHaveLength(1)

      update.resolve(asset)
      await waitForMutations(actor)
      expect(reported('asset.updated')).toHaveLength(1)
    })

    it('loads the next page only while idle, after a full page', async () => {
      const client = createMockSanityClient({
        fetch: vi
          .fn()
          .mockResolvedValueOnce([imageAsset('a1'), imageAsset('a2')])
          .mockResolvedValueOnce([imageAsset('a2'), imageAsset('a3')])
          .mockResolvedValueOnce([imageAsset('a4')]),
      })
      const {actor} = startAssetsActor({client, input: {pageSize: 2}})

      actor.send({type: 'load'})
      actor.send({type: 'load.more'})
      await waitForFetch(actor)
      expect(client.fetch).toHaveBeenCalledTimes(1)

      actor.send({type: 'load.more'})
      await waitForFetch(actor)
      expect(lastFetch(client).query).toContain('[2...4]')

      actor.send({type: 'load.more'})
      await waitForFetch(actor)
      expect(actor.getSnapshot().context.allIds).toEqual(['a1', 'a2', 'a3', 'a4'])

      // The last page was short: there is nothing more to load
      actor.send({type: 'load.more'})
      expect(actor.getSnapshot().matches({fetch: 'idle'})).toBe(true)
      expect(client.fetch).toHaveBeenCalledTimes(3)
    })
  })

  describe('browse query', () => {
    it('debounces search changes and then refetches from the first page', async () => {
      const {actor, client, clock} = await startWithAssets([imageAsset('a1')])
      actor.send({type: 'pick.toggle', assetId: 'a1'})

      actor.send({type: 'search.query.set', query: 'cat'})
      expect(actor.getSnapshot().context.byIds['a1']?.picked).toBe(false)
      expect(actor.getSnapshot().matches({fetch: 'debouncing'})).toBe(true)

      clock.increment(399)
      actor.send({type: 'search.query.set', query: 'cats'})
      clock.increment(399)
      expect(client.fetch).not.toHaveBeenCalled()
      expect(actor.getSnapshot().context.allIds).toEqual(['a1'])

      clock.increment(1)
      expect(actor.getSnapshot().matches({fetch: 'fetching'})).toBe(true)
      expect(actor.getSnapshot().context.allIds).toEqual([])
      expect(lastFetch(client).query).toContain(`match '*cats*'`)
    })

    it('updates, replaces and removes search facets', () => {
      const {actor} = startAssetsActor()
      const facets = () => actor.getSnapshot().context.searchFacets

      actor.send({type: 'search.facet.add', facet: inputs.title})
      const [titleFacet] = facets()
      expect(titleFacet).toMatchObject({id: expect.any(String), name: 'title'})

      actor.send({type: 'search.facet.update', facetId: titleFacet!.id, update: {value: 'hero'}})
      expect(facets()[0]).toMatchObject({name: 'title', value: 'hero'})

      actor.send({type: 'search.facet.add', facet: inputs.type})
      actor.send({type: 'search.facet.updateByName', name: 'type', update: {value: 'image'}})
      expect(facets().map((facet) => [facet.name, facet.value])).toEqual([
        ['title', 'hero'],
        ['type', 'image'],
      ])

      actor.send({type: 'search.facet.remove', facetId: titleFacet!.id})
      expect(facets().map((facet) => facet.name)).toEqual(['type'])

      const tagFacet = {
        ...inputs.tag,
        value: {label: 'alpha', value: 't1'},
      } as SearchFacetInputSearchableProps
      actor.send({type: 'search.facets.set', facets: [tagFacet]})
      expect(facets()).toEqual([{...tagFacet, id: expect.any(String)}])

      actor.send({type: 'search.tag.remove', tagId: 't1'})
      expect(facets()).toEqual([])

      actor.send({type: 'search.facet.add', facet: inputs.title})
      actor.send({type: 'search.facets.clear'})
      expect(facets()).toEqual([])
    })

    it('refetches right away when the order or folder changes', async () => {
      const {actor, client} = await startWithAssets([imageAsset('a1')])
      actor.send({type: 'pick.toggle', assetId: 'a1'})

      actor.send({type: 'order.set', order: {direction: 'asc', field: 'size'}})
      expect(actor.getSnapshot().matches({fetch: 'fetching'})).toBe(true)
      expect(actor.getSnapshot().context.byIds['a1']?.picked).toBe(false)
      expect(lastFetch(client).query).toContain('order(size asc)')
      await waitForFetch(actor)

      actor.send({type: 'folder.open', folderId: 'folder-1'})
      expect(actor.getSnapshot().context.currentFolderId).toBe('folder-1')
      expect(lastFetch(client).query).toContain('opt.media.folder._ref == "folder-1"')
    })

    it('clears picks when switching views', async () => {
      const {actor} = await startWithAssets([imageAsset('a1')])
      actor.send({type: 'pick.toggle', assetId: 'a1'})

      actor.send({type: 'view.set', view: 'table'})

      expect(actor.getSnapshot().context.view).toBe('table')
      expect(selectPickedAssets(actor.getSnapshot())).toEqual([])
    })

    it('leaves the current folder once it no longer exists', async () => {
      const {actor, client} = await startWithAssets([imageAsset('a1')])
      actor.send({type: 'folder.open', folderId: 'folder-1'})
      await waitForFetch(actor)
      client.fetch.mockClear()

      actor.send({type: 'folders.synced', folderIds: ['folder-1', 'folder-2']})
      actor.send({type: 'folder.deleted', folderId: 'folder-2'})
      expect(client.fetch).not.toHaveBeenCalled()

      actor.send({type: 'folder.deleted', folderId: 'folder-1'})
      expect(actor.getSnapshot().context.currentFolderId).toBeNull()
      expect(lastFetch(client).query).not.toContain('opt.media.folder._ref')
      await waitForFetch(actor)

      actor.send({type: 'folder.open', folderId: 'folder-2'})
      await waitForFetch(actor)
      actor.send({type: 'folders.synced', folderIds: ['folder-1']})
      expect(actor.getSnapshot().context.currentFolderId).toBeNull()
    })

    it('keeps tag facet labels in sync with renamed tags without refetching', async () => {
      const {actor, client, clock} = await startWithAssets([])
      actor.send({
        type: 'search.facet.add',
        facet: {
          ...inputs.tag,
          value: {label: 'alpha', value: 't1'},
        } as SearchFacetInputSearchableProps,
      })
      clock.increment(400)
      await waitForFetch(actor)
      client.fetch.mockClear()

      actor.send({type: 'tag.renamed', tag: tag('t1', 'beta')})

      expect(actor.getSnapshot().context.searchFacets[0]).toMatchObject({
        value: {label: 'beta', value: 't1'},
      })
      expect(actor.getSnapshot().matches({fetch: 'idle'})).toBe(true)
      expect(client.fetch).not.toHaveBeenCalled()
    })
  })

  describe('picking', () => {
    const assets = ['a1', 'a2', 'a3', 'a4'].map((id) => imageAsset(id))
    const pickedIds = (actor: AssetsActorRef) =>
      selectPickedAssets(actor.getSnapshot()).map((item) => item.asset._id)

    it('toggles picks and remembers the last picked asset', async () => {
      const {actor} = await startWithAssets(assets)

      actor.send({type: 'pick.toggle', assetId: 'a2'})
      expect(pickedIds(actor)).toEqual(['a2'])
      expect(actor.getSnapshot().context.lastPicked).toBe('a2')

      actor.send({type: 'pick.toggle', assetId: 'a2'})
      expect(pickedIds(actor)).toEqual([])
      expect(actor.getSnapshot().context.lastPicked).toBeUndefined()
    })

    it('picks ranges from the last picked asset in either direction', async () => {
      const {actor} = await startWithAssets(assets)

      actor.send({type: 'pick.toggle', assetId: 'a3'})
      actor.send({type: 'pick.range', assetId: 'a1'})
      expect(pickedIds(actor)).toEqual(['a1', 'a2', 'a3'])
      expect(actor.getSnapshot().context.lastPicked).toBe('a1')

      actor.send({type: 'pick.clear'})
      actor.send({type: 'pick.range', assetId: 'a4'})
      expect(pickedIds(actor)).toEqual(['a4'])
    })

    it('picks and clears every listed asset', async () => {
      const {actor} = await startWithAssets(assets)

      actor.send({type: 'pick.all'})
      expect(pickedIds(actor)).toEqual(['a1', 'a2', 'a3', 'a4'])

      actor.send({type: 'pick.clear'})
      expect(pickedIds(actor)).toEqual([])
    })

    it('only replaces the items whose pick changed', async () => {
      const {actor} = await startWithAssets(assets)
      actor.send({type: 'pick.toggle', assetId: 'a1'})
      const before = actor.getSnapshot().context.byIds

      actor.send({type: 'pick.clear'})
      const after = actor.getSnapshot().context.byIds

      expect(after['a1']).not.toBe(before['a1'])
      expect(after['a2']).toBe(before['a2'])

      actor.send({type: 'pick.clear'})
      expect(actor.getSnapshot().context.byIds).toBe(after)
    })

    it('keeps returning the same picked assets until the list or picks change', async () => {
      const {actor} = await startWithAssets(assets)
      actor.send({type: 'pick.toggle', assetId: 'a1'})
      const picked = selectPickedAssets(actor.getSnapshot())

      // Changes the snapshot, but neither the list nor the picks
      actor.send({type: 'folder.open', folderId: null})
      expect(selectPickedAssets(actor.getSnapshot())).not.toBe(picked)
      await waitForFetch(actor)

      const repicked = selectPickedAssets(actor.getSnapshot())
      actor.send({type: 'tag.renamed', tag: tag('t1', 'alpha')})
      expect(selectPickedAssets(actor.getSnapshot())).toBe(repicked)
    })
  })

  describe('updating assets', () => {
    it('patches the asset, then reports it with the dialog to close', async () => {
      const asset = imageAsset('a1')
      const updated = imageAsset('a1', {title: 'Updated', _updatedAt: '2025-01-01T00:00:00Z'})
      const {actor, client, events} = await startWithAssets([asset])
      const request = deferred<Asset>()
      const patch = mockPatchChain(request.promise)
      client.patch.mockReturnValue(patch)

      actor.send({type: 'asset.update', asset, closeDialogId: 'a1', formData: {title: 'Updated'}})
      expect(actor.getSnapshot().context.byIds['a1']?.updating).toBe(true)
      request.resolve(updated)
      await waitForMutations(actor)

      expect(client.patch).toHaveBeenCalledWith('a1')
      expect(patch.setIfMissing).toHaveBeenCalledWith({opt: {}})
      expect(patch.setIfMissing).toHaveBeenCalledWith({'opt.media': {}})
      expect(patch.set).toHaveBeenCalledWith({title: 'Updated'})
      expect(actor.getSnapshot().context.byIds['a1']).toEqual(assetItem(updated))
      expect(events).toEqual([{type: 'asset.updated', asset: updated, closeDialogId: 'a1'}])
    })

    it('keeps the list sorted by the current order after an update', async () => {
      const {actor, client} = await startWithAssets([
        imageAsset('a1', {size: 1}),
        imageAsset('a2', {size: 2}),
      ])
      client.fetch.mockResolvedValue([imageAsset('a2', {size: 2}), imageAsset('a1', {size: 1})])
      actor.send({type: 'order.set', order: {direction: 'desc', field: 'size'}})
      await waitForFetch(actor)
      client.patch.mockReturnValue(mockPatchChain(imageAsset('a1', {size: 3})))

      actor.send({type: 'asset.update', asset: imageAsset('a1'), formData: {}})
      await waitForMutations(actor)

      expect(actor.getSnapshot().context.allIds).toEqual(['a1', 'a2'])
    })

    it('attaches failures to the asset and reports them', async () => {
      const asset = imageAsset('a1')
      const {actor, client, events} = await startWithAssets([asset])
      const patch = mockPatchChain()
      patch.commit.mockRejectedValue({message: 'Revision mismatch', statusCode: 409})
      client.patch.mockReturnValue(patch)

      actor.send({type: 'asset.update', asset, formData: {}})
      await waitForMutations(actor)

      expect(actor.getSnapshot().context.byIds['a1']).toEqual(
        assetItem(asset, {error: 'Revision mismatch'}),
      )
      expect(events).toEqual([
        {type: 'asset.updateFailed', error: {message: 'Revision mismatch', statusCode: 409}},
      ])
    })

    it('runs mutations one at a time, in the order they were requested', async () => {
      const asset = imageAsset('a1')
      const {actor, client} = await startWithAssets([asset, imageAsset('a2')])
      const update = deferred<Asset>()
      client.patch.mockReturnValue(mockPatchChain(update.promise))

      actor.send({type: 'asset.update', asset, formData: {}})
      actor.send({type: 'assets.delete', assets: [imageAsset('a2')]})

      expect(actor.getSnapshot().matches({mutations: 'updating'})).toBe(true)
      expect(client.delete).not.toHaveBeenCalled()
      update.resolve(asset)
      await waitForMutations(actor)
      expect(client.delete).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleting assets', () => {
    it('deletes the assets, reports them, and refetches once the list is empty', async () => {
      const assets = [imageAsset('a1'), imageAsset('a2')]
      const {actor, client, events} = await startWithAssets(assets)

      actor.send({type: 'assets.delete', assets})
      expect(actor.getSnapshot().context.byIds['a1']?.updating).toBe(true)
      await waitForMutations(actor)

      expect(client.delete).toHaveBeenCalledWith({
        params: {assetIds: ['a1', 'a2']},
        query: '*[_id in $assetIds]',
      })
      expect(events).toEqual([{type: 'assets.deleted', assetIds: ['a1', 'a2']}])
      expect(client.fetch).toHaveBeenCalledTimes(1)
      expect(lastFetch(client).query).toContain('[0...100]')
    })

    it('keeps the rest of the list when some assets remain', async () => {
      const assets = [imageAsset('a1'), imageAsset('a2')]
      const {actor, client} = await startWithAssets(assets)

      actor.send({type: 'assets.delete', assets: [assets[0]!]})
      await waitForMutations(actor)

      expect(actor.getSnapshot().context.allIds).toEqual(['a2'])
      expect(actor.getSnapshot().context.byIds['a1']).toBeUndefined()
      expect(client.fetch).not.toHaveBeenCalled()
    })

    it('attaches the errors of assets that could not be deleted', async () => {
      const assets = [imageAsset('a1'), imageAsset('a2')]
      const {actor, client, events} = await startWithAssets(assets)
      client.delete.mockRejectedValue({
        message: 'Referenced',
        response: {
          body: {error: {items: [{error: {description: 'Asset is in use', id: 'a2'}}]}},
        },
      })

      actor.send({type: 'assets.delete', assets})
      await waitForMutations(actor)

      expect(actor.getSnapshot().context.byIds).toEqual({
        a1: assetItem(assets[0]!),
        a2: assetItem(assets[1]!, {error: 'Asset is in use'}),
      })
      expect(events).toEqual([{type: 'assets.deleteFailed', assetIds: ['a1', 'a2']}])
    })
  })

  describe('tagging assets', () => {
    const alpha = tag('t1', 'alpha')

    it('adds the tag to assets that do not have it yet', async () => {
      const untagged = imageAsset('a1')
      const tagged = imageAsset('a2', {opt: {media: {tags: [tagReference('t1')]}}})
      const {actor, client, events} = await startWithAssets([untagged, tagged])
      const transaction = mockTransaction()
      client.transaction.mockReturnValue(transaction)
      const items = [assetItem(untagged), assetItem(tagged)]

      actor.send({type: 'assets.tag.add', assets: items, tag: alpha})
      expect(actor.getSnapshot().context.byIds['a2']?.updating).toBe(true)
      await waitForMutations(actor)

      expect(transaction.patch).toHaveBeenCalledTimes(1)
      expect(transaction.patch).toHaveBeenCalledWith('a1', expect.any(Function))
      expect(transaction.patchChain.append).toHaveBeenCalledWith('opt.media.tags', [
        {_key: expect.any(String), _ref: 't1', _type: 'reference', _weak: true},
      ])
      expect(transaction.commit).toHaveBeenCalledTimes(1)
      expect(actor.getSnapshot().context.byIds['a2']?.updating).toBe(false)
      expect(events).toEqual([{type: 'assets.tagged', assets: items, operation: 'add', tag: alpha}])
    })

    it('does not commit when every asset already has the tag', async () => {
      const tagged = imageAsset('a1', {opt: {media: {tags: [tagReference('t1')]}}})
      const {actor, client, events} = await startWithAssets([tagged])

      actor.send({type: 'assets.tag.add', assets: [assetItem(tagged)], tag: alpha})
      await waitForMutations(actor)

      expect(client.transaction).not.toHaveBeenCalled()
      expect(events).toHaveLength(1)
    })

    it('removes the tag guarded by the latest known revision of each asset', async () => {
      const asset = imageAsset('a1', {opt: {media: {tags: [tagReference('t1')]}}})
      const {actor, client, clock} = await startWithAssets([asset])
      actor.send({
        type: 'listener.mutation',
        documentId: 'a1',
        result: {...asset, _rev: 'newer-rev'},
        transition: 'update',
      })
      clock.increment(2000)
      const transaction = mockTransaction()
      client.transaction.mockReturnValue(transaction)

      // The request carries the asset as it was when the confirm dialog opened
      actor.send({type: 'assets.tag.remove', assets: [assetItem(asset)], tag: alpha})
      await waitForMutations(actor)

      expect(transaction.patchChain.unset).toHaveBeenCalledWith(['opt.media.tags[_ref == "t1"]'])
      expect(transaction.patchChain.ifRevisionId).toHaveBeenCalledWith('newer-rev')
    })

    it('reports failures so the tag stops showing as busy', async () => {
      const asset = imageAsset('a1')
      const {actor, client, events} = await startWithAssets([asset])
      const transaction = mockTransaction()
      transaction.commit.mockRejectedValue(new Error('nope'))
      client.transaction.mockReturnValue(transaction)

      actor.send({type: 'assets.tag.add', assets: [assetItem(asset)], tag: alpha})
      await waitForMutations(actor)

      expect(actor.getSnapshot().context.byIds['a1']?.updating).toBe(false)
      expect(events).toEqual([{type: 'assets.taggingFailed', tag: alpha}])
    })
  })

  describe('moving assets to folders', () => {
    it('moves the assets, then refetches the list without picks', async () => {
      const asset = imageAsset('a1')
      const {actor, client, events} = await startWithAssets([asset])
      const transaction = mockTransaction()
      client.transaction.mockReturnValue(transaction)
      client.fetch.mockReturnValue(new Promise(() => undefined))
      actor.send({type: 'pick.toggle', assetId: 'a1'})

      actor.send({
        type: 'assets.folder.set',
        assets: [assetItem(asset)],
        closeDialogId: 'folderMove',
        folderId: 'folder-1',
      })
      await waitForMutations(actor)

      expect(transaction.patch).toHaveBeenCalledWith('a1', expect.any(Function))
      expect(transaction.patchChain.set).toHaveBeenCalledWith({
        'opt.media.folder': folderReference('folder-1'),
      })
      expect(events).toEqual([{type: 'assets.moved', closeDialogId: 'folderMove'}])
      expect(actor.getSnapshot().context.byIds['a1']).toEqual(
        assetItem({...asset, opt: {media: {folder: folderReference('folder-1')}}}),
      )
      expect(actor.getSnapshot().matches({fetch: 'fetching'})).toBe(true)
      expect(client.fetch).toHaveBeenCalledTimes(1)
    })

    it('removes the folder assignment when moving to no folder', async () => {
      const asset = imageAsset('a1', {opt: {media: {folder: folderReference('folder-1')}}})
      const {actor, client} = await startWithAssets([asset])
      const transaction = mockTransaction()
      client.transaction.mockReturnValue(transaction)

      actor.send({type: 'assets.folder.set', assets: [assetItem(asset)], folderId: null})
      await waitForMutations(actor)

      expect(transaction.patchChain.unset).toHaveBeenCalledWith(['opt.media.folder'])
    })

    it('attaches failures to the assets', async () => {
      const asset = imageAsset('a1')
      const {actor, client} = await startWithAssets([asset])
      const transaction = mockTransaction()
      transaction.commit.mockRejectedValue({message: 'Forbidden', statusCode: 403})
      client.transaction.mockReturnValue(transaction)

      actor.send({type: 'assets.folder.set', assets: [assetItem(asset)], folderId: 'folder-1'})
      await waitForMutations(actor)

      expect(actor.getSnapshot().context.byIds['a1']).toEqual(
        assetItem(asset, {error: 'Forbidden'}),
      )
    })
  })

  describe('replacing references', () => {
    const original = imageAsset('a1')
    const replacement = imageAsset('a2')
    const waitForReplacements = (actor: AssetsActorRef) =>
      vi.waitFor(() => expect(actor.getSnapshot().context.referenceReplacements).toEqual([]))

    it('re-points every referencing document in a single transaction', async () => {
      const {actor, client} = await startWithAssets([original, replacement])
      client.fetch.mockResolvedValue([
        {
          _id: 'doc-1',
          _rev: 'rev-1',
          _type: 'post',
          hero: {_type: 'image', asset: {_ref: 'a1', _type: 'reference'}},
          thumbnail: {_type: 'image', asset: {_ref: 'a1', _type: 'reference'}},
        },
        {_id: 'doc-2', _rev: 'rev-2', _type: 'post', title: 'Unrelated'},
      ])
      const transaction = mockTransaction()
      client.transaction.mockReturnValue(transaction)

      actor.send({type: 'asset.references.replace', asset: replacement, targetId: 'a1'})
      expect(actor.getSnapshot().context.byIds['a1']?.updating).toBe(true)
      await waitForReplacements(actor)

      expect(client.fetch).toHaveBeenCalledWith('*[references($id)]', {id: 'a1'})
      expect(transaction.patch).toHaveBeenCalledTimes(1)
      expect(transaction.patchChain.ifRevisionId).toHaveBeenCalledWith('rev-1')
      expect(transaction.patchChain.set).toHaveBeenCalledWith({
        hero: {_type: 'image', asset: {_ref: 'a2', _type: 'reference'}},
        thumbnail: {_type: 'image', asset: {_ref: 'a2', _type: 'reference'}},
      })
      expect(transaction.commit).toHaveBeenCalledTimes(1)
      expect(actor.getSnapshot().context.byIds['a1']?.updating).toBe(false)
    })

    it('does not commit when no document needs to change', async () => {
      const {actor, client} = await startWithAssets([original, replacement])
      client.fetch.mockResolvedValue([])

      actor.send({type: 'asset.references.replace', asset: replacement, targetId: 'a1'})
      await waitForReplacements(actor)

      expect(client.transaction().commit).not.toHaveBeenCalled()
      expect(actor.getSnapshot().context.byIds['a1']?.updating).toBe(false)
    })

    it('attaches failures to the asset being replaced', async () => {
      const {actor, client, events} = await startWithAssets([original, replacement])
      client.fetch.mockRejectedValue({message: 'boom', statusCode: 500})

      actor.send({type: 'asset.references.replace', asset: replacement, targetId: 'a1'})
      await waitForReplacements(actor)

      expect(actor.getSnapshot().context.byIds['a1']).toEqual(assetItem(original, {error: 'boom'}))
      expect(actor.getSnapshot().context.byIds['a2']).toEqual(assetItem(replacement))
      expect(events).toEqual([
        {type: 'asset.updateFailed', error: {message: 'boom', statusCode: 500}},
      ])
    })

    it('does not hold up other mutations while replacing', async () => {
      const {actor, client} = await startWithAssets([original, replacement])
      client.fetch.mockReturnValue(new Promise(() => undefined))

      actor.send({type: 'asset.references.replace', asset: replacement, targetId: 'a1'})
      actor.send({type: 'assets.delete', assets: [replacement]})
      await waitForMutations(actor)

      expect(client.delete).toHaveBeenCalledTimes(1)
      expect(actor.getSnapshot().matches({references: 'replacing'})).toBe(true)
    })
  })

  describe('realtime updates', () => {
    it('applies changes to listed assets in batches', async () => {
      const {actor, clock, events} = await startWithAssets([imageAsset('a1'), imageAsset('a2')])
      const renamed = imageAsset('a1', {title: 'Renamed'})

      actor.send({
        type: 'listener.mutation',
        documentId: 'a1',
        result: renamed,
        transition: 'update',
      })
      actor.send({type: 'listener.mutation', documentId: 'a2', transition: 'disappear'})
      actor.send({
        type: 'listener.mutation',
        documentId: 'a3',
        result: imageAsset('a3'),
        transition: 'appear',
      })
      clock.increment(1999)
      expect(actor.getSnapshot().context.byIds['a1']?.asset.title).toBeUndefined()

      clock.increment(1)
      expect(actor.getSnapshot().context).toMatchObject({
        allIds: ['a1'],
        byIds: {a1: assetItem(renamed)},
        listenerEvents: [],
      })
      expect(events).toEqual([{type: 'assets.synced'}])
    })
  })

  describe('verifying uploads', () => {
    it('lists uploaded assets that match the browse query, in order', async () => {
      const {actor, client, clock, events} = await startWithAssets([
        imageAsset('a1', {_createdAt: '2024-01-01T00:00:00Z'}),
      ])
      client.fetch.mockResolvedValue(['up-1'])
      const upload = imageAsset('up-1', {_createdAt: '2025-01-01T00:00:00Z'})
      const unmatched = imageAsset('up-2', {_createdAt: '2025-01-02T00:00:00Z'})

      actor.send({type: 'upload.completed', asset: upload})
      actor.send({type: 'upload.completed', asset: unmatched})
      clock.increment(999)
      expect(client.fetch).not.toHaveBeenCalled()

      clock.increment(1)
      await vi.waitFor(() => expect(actor.getSnapshot().matches({uploads: 'idle'})).toBe(true))

      expect(client.fetch).toHaveBeenCalledTimes(1)
      expect(lastFetch(client).params).toMatchObject({uploadedAssetIds: ['up-1', 'up-2']})
      expect(actor.getSnapshot().context.allIds).toEqual(['up-1', 'a1'])
      expect(events).toEqual([{type: 'uploads.verified', hashes: ['up-1-hash', 'up-2-hash']}])
    })

    it('stops showing uploads as in progress when verification fails', async () => {
      const {actor, client, clock, events} = await startWithAssets([])
      client.fetch.mockRejectedValue(new Error('offline'))

      actor.send({type: 'upload.completed', asset: imageAsset('up-1')})
      clock.increment(1000)
      await vi.waitFor(() => expect(events).toHaveLength(1))

      expect(events).toEqual([{type: 'uploads.verified', hashes: ['up-1-hash']}])
      expect(actor.getSnapshot().context.allIds).toEqual([])
    })
  })

  describe('replacing an asset', () => {
    it('browses the whole library while replacing, then restores the scope', async () => {
      const assets = [imageAsset('a1'), imageAsset('a2')]
      const {actor, client} = await startWithAssets(assets)
      actor.send({type: 'folder.open', folderId: 'folder-1'})
      await waitForFetch(actor)
      actor.send({type: 'pick.toggle', assetId: 'a1'})
      client.fetch.mockClear()

      actor.send({type: 'replace.start', assetId: 'a1'})
      expect(actor.getSnapshot().context.currentFolderId).toBeNull()
      expect(lastFetch(client).query).not.toContain('opt.media.folder._ref')
      await waitForFetch(actor)
      expect(selectReplacementCandidateIds(actor.getSnapshot())).toEqual(['a2'])

      actor.send({type: 'replace.end'})
      expect(actor.getSnapshot().context.currentFolderId).toBe('folder-1')
      expect(actor.getSnapshot().context.replace).toBeUndefined()
      expect(lastFetch(client).query).toContain('opt.media.folder._ref == "folder-1"')
      await waitForFetch(actor)
      expect(selectPickedAssets(actor.getSnapshot()).map((item) => item.asset._id)).toEqual(['a1'])
    })

    it('keeps the loaded assets when there is no scope to clear', async () => {
      const {actor, client} = await startWithAssets([imageAsset('a1'), imageAsset('a2')])

      actor.send({type: 'replace.start', assetId: 'a1'})
      actor.send({type: 'replace.end'})

      expect(client.fetch).not.toHaveBeenCalled()
      expect(actor.getSnapshot().context.allIds).toEqual(['a1', 'a2'])
    })

    it('loads more pages until it finds replacement candidates', async () => {
      const client = createMockSanityClient({
        fetch: vi
          .fn()
          .mockResolvedValueOnce([imageAsset('a1'), fileAsset('f1')])
          .mockResolvedValueOnce([fileAsset('f2'), imageAsset('a2')])
          .mockResolvedValue([]),
      })
      const {actor} = startAssetsActor({client, input: {pageSize: 2}})
      actor.send({type: 'load'})
      await waitForFetch(actor)

      actor.send({type: 'replace.start', assetId: 'a1'})
      await waitForFetch(actor)

      expect(client.fetch).toHaveBeenCalledTimes(2)
      expect(selectReplacementCandidateIds(actor.getSnapshot())).toEqual(['a2'])
    })

    it('stops loading pages when a fetch fails', async () => {
      const client = createMockSanityClient({
        fetch: vi
          .fn()
          .mockResolvedValueOnce([imageAsset('a1'), fileAsset('f1')])
          .mockRejectedValueOnce(new Error('offline')),
      })
      const {actor} = startAssetsActor({client, input: {pageSize: 2}})
      actor.send({type: 'load'})
      await waitForFetch(actor)

      actor.send({type: 'replace.start', assetId: 'a1'})
      await vi.waitFor(() => expect(actor.getSnapshot().context.fetchingError).toBeDefined())

      expect(client.fetch).toHaveBeenCalledTimes(2)
      expect(actor.getSnapshot().matches({fetch: 'idle'})).toBe(true)
    })
  })
})

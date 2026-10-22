// @vitest-environment node
import {describe, expect, it, vi} from 'vitest'
import {createActor, SimulatedClock} from 'xstate'

import {
  createMockSanityClient,
  deferred,
  mockTransaction,
} from '../__tests__/fixtures/mockSanityClient'
import {createTestParent} from '../__tests__/fixtures/testParent'
import type {FolderDoc} from '../types'
import {
  type FoldersActorRef,
  foldersMachine,
  type FoldersReport,
  selectFolderAncestry,
  selectFolderChildren,
  selectFolderPath,
  selectIsCreatingFolder,
} from './foldersMachine'

type FolderRow = FolderDoc & {count: number}

const rows: FolderRow[] = [
  {_id: 'campaigns', count: 1, name: 'Campaigns', parentId: null},
  {_id: 'summer', count: 2, name: 'Summer', parentId: 'campaigns'},
  {_id: 'archive', count: 4, name: 'Archive', parentId: null},
  {_id: 'orphan', count: 0, name: 'Orphan', parentId: 'deleted-folder'},
]

function startFoldersActor(client = createMockSanityClient()) {
  const clock = new SimulatedClock()
  const testParent = createTestParent<FoldersReport>({clock})
  const actor = createActor(foldersMachine, {
    input: {
      assetTypes: ['image'],
      client,
      excludeTagSlugs: ['private'],
      showMediaLibraryAssets: false,
    },
    parent: testParent.parent,
  }).start()
  return {actor, client, clock, ...testParent}
}

const waitForFetch = (actor: FoldersActorRef) =>
  vi.waitFor(() => expect(actor.getSnapshot().matches({fetch: 'idle'})).toBe(true))

const waitForMutations = (actor: FoldersActorRef) =>
  vi.waitFor(() => expect(actor.getSnapshot().context.mutations).toEqual([]))

async function startWithFolders(folders: FolderRow[] = rows) {
  const harness = startFoldersActor(
    createMockSanityClient({fetch: vi.fn(() => Promise.resolve(folders))}),
  )
  harness.actor.send({type: 'fetch'})
  await waitForFetch(harness.actor)
  harness.client.fetch.mockClear()
  harness.events.length = 0
  return harness
}

describe(foldersMachine.id, () => {
  it('builds the folder tree with asset counts, and reports the folder ids', async () => {
    const {actor, client, events} = startFoldersActor(
      createMockSanityClient({fetch: vi.fn(() => Promise.resolve(rows))}),
    )

    actor.send({type: 'fetch'})
    await waitForFetch(actor)

    const [query, params] = client.fetch.mock.lastCall ?? []
    expect(query).toContain('_type == "media.folder"')
    expect(query).toContain('name.current in ["private"]')
    expect(query).toContain('sanity-media-library')
    expect(params).toEqual({assetTypes: ['sanity.imageAsset']})

    const {tree} = actor.getSnapshot().context
    expect(tree.map((node) => [node.name, node.totalCount])).toEqual([
      ['Archive', 4],
      ['Campaigns', 3],
      ['Orphan', 0],
    ])
    expect(tree[1]?.children).toEqual([
      {
        children: [],
        exactCount: 2,
        id: 'summer',
        name: 'Summer',
        parentId: 'campaigns',
        path: 'Campaigns/Summer',
        totalCount: 2,
      },
    ])
    expect(events).toEqual([
      {type: 'folders.fetched', folderIds: ['campaigns', 'summer', 'archive', 'orphan']},
    ])
  })

  it('debounces refresh requests into a single fetch', async () => {
    const {actor, client, clock} = await startWithFolders()

    actor.send({type: 'refresh'})
    clock.increment(200)
    actor.send({type: 'refresh'})
    clock.increment(299)
    expect(client.fetch).not.toHaveBeenCalled()

    clock.increment(1)
    expect(client.fetch).toHaveBeenCalledTimes(1)
  })

  it('keeps mutations going while folders are refetched', async () => {
    const {actor, client, clock, reported} = await startWithFolders()
    const created = deferred()
    client.create.mockReturnValue(created.promise)
    actor.send({type: 'folder.create', name: 'Winter', parentId: null})

    actor.send({type: 'fetch'})
    actor.send({type: 'refresh'})
    clock.increment(300)
    await waitForFetch(actor)

    expect(client.create).toHaveBeenCalledTimes(1)
    created.resolve()
    await waitForMutations(actor)
    expect(reported('folder.created')).toHaveLength(1)
  })

  it('selects folder paths, children and ancestry', async () => {
    const {actor} = await startWithFolders()
    const snapshot = actor.getSnapshot()

    expect(selectFolderPath(snapshot, 'summer')).toBe('Campaigns/Summer')
    expect(selectFolderPath(snapshot, 'missing')).toBe('')
    expect(selectFolderChildren(snapshot, 'campaigns').map((node) => node.id)).toEqual(['summer'])
    expect(selectFolderChildren(snapshot, null)).toEqual([])
    expect(selectFolderAncestry(snapshot, 'summer').map((node) => node.id)).toEqual([
      'campaigns',
      'summer',
    ])
  })

  describe('creating', () => {
    it('creates the folder inside its parent and reports it', async () => {
      const {actor, client, clock, events} = await startWithFolders()

      actor.send({type: 'folder.create', name: '  Winter  ', parentId: 'campaigns'})
      expect(selectIsCreatingFolder(actor.getSnapshot())).toBe(true)
      await waitForMutations(actor)

      expect(client.create).toHaveBeenCalledWith({
        _id: expect.stringMatching(/^media\.folder\./),
        _type: 'media.folder',
        name: 'Winter',
        parent: {_ref: 'campaigns', _type: 'reference', _weak: true},
      })
      const folderId = client.create.mock.lastCall?.[0]._id
      expect(events).toEqual([{type: 'folder.created', folderId}])

      clock.increment(300)
      expect(client.fetch).toHaveBeenCalledTimes(1)
    })

    it.each([
      ['   ', 'Folder name cannot be empty', 400],
      ['summer', 'A folder with this name already exists here', 409],
    ])('rejects the name "%s"', async (name, message, statusCode) => {
      const {actor, client, events} = await startWithFolders()

      actor.send({type: 'folder.create', name, parentId: 'campaigns'})
      await waitForMutations(actor)

      expect(client.create).not.toHaveBeenCalled()
      expect(actor.getSnapshot().context.creatingError).toEqual({message, statusCode})
      expect(events).toEqual([{type: 'folder.createFailed', error: {message, statusCode}}])
    })
  })

  describe('renaming', () => {
    it('renames the folder', async () => {
      const {actor, client, events} = await startWithFolders()
      const patch = {commit: vi.fn(() => Promise.resolve({})), set: vi.fn()}
      patch.set.mockReturnValue(patch)
      client.patch.mockReturnValue(patch)

      actor.send({type: 'folder.rename', folderId: 'summer', name: 'Autumn'})
      await waitForMutations(actor)

      expect(client.patch).toHaveBeenCalledWith('summer')
      expect(patch.set).toHaveBeenCalledWith({name: 'Autumn'})
      expect(events).toEqual([{type: 'folder.renamed'}])
    })

    it.each([
      ['missing', 'Autumn', 'Folder not found', 404],
      ['summer', '', 'Folder name cannot be empty', 400],
      ['summer', 'Summer', 'Folder name has not changed', 400],
      ['archive', 'CAMPAIGNS', 'A folder with this name already exists here', 409],
    ])('rejects renaming %s to "%s"', async (folderId, name, message, statusCode) => {
      const {actor, client, events} = await startWithFolders()

      actor.send({type: 'folder.rename', folderId, name})
      await waitForMutations(actor)

      expect(client.patch).not.toHaveBeenCalled()
      expect(actor.getSnapshot().context.renameError).toEqual({message, statusCode})
      expect(events).toEqual([{type: 'folder.renameFailed', error: {message, statusCode}}])

      actor.send({type: 'renameError.clear'})
      expect(actor.getSnapshot().context.renameError).toBeUndefined()
    })
  })

  describe('deleting', () => {
    it('clears the folder of its assets and moves its child folders up', async () => {
      const {actor, client, events} = await startWithFolders([
        {_id: 'parent', count: 0, name: 'Parent', parentId: null},
        {_id: 'target', count: 1, name: 'Target', parentId: 'parent'},
        {_id: 'child', count: 0, name: 'Child', parentId: 'target'},
      ])
      client.fetch.mockResolvedValue([{_id: 'asset-in-folder'}])
      const transaction = mockTransaction()
      client.transaction.mockReturnValue(transaction)

      actor.send({type: 'folder.delete', folderId: 'target'})
      await waitForMutations(actor)

      expect(client.fetch).toHaveBeenCalledWith(expect.stringContaining('$folderId'), {
        assetTypes: ['sanity.imageAsset'],
        folderId: 'target',
      })
      expect(transaction.patch.mock.calls.map(([id]) => id)).toEqual(['asset-in-folder', 'child'])
      expect(transaction.patchChain.unset).toHaveBeenCalledWith(['opt.media.folder'])
      expect(transaction.patchChain.set).toHaveBeenCalledWith({
        parent: {_ref: 'parent', _type: 'reference', _weak: true},
      })
      expect(transaction.delete).toHaveBeenCalledWith('target')
      expect(events).toEqual([{type: 'folder.deleted', folderId: 'target'}])
    })

    it('moves the child folders of a root folder to the root', async () => {
      const {actor, client} = await startWithFolders([
        {_id: 'target', count: 0, name: 'Target', parentId: null},
        {_id: 'child', count: 0, name: 'Child', parentId: 'target'},
      ])
      const transaction = mockTransaction()
      client.transaction.mockReturnValue(transaction)

      actor.send({type: 'folder.delete', folderId: 'target'})
      await waitForMutations(actor)

      expect(transaction.patchChain.unset).toHaveBeenCalledWith(['parent'])
    })

    it('reports failures', async () => {
      const {actor, client, events} = await startWithFolders()
      client.fetch.mockRejectedValue({message: 'Forbidden', statusCode: 403})

      actor.send({type: 'folder.delete', folderId: 'archive'})
      await waitForMutations(actor)

      expect(events).toEqual([
        {type: 'folder.deleteFailed', error: {message: 'Forbidden', statusCode: 403}},
      ])
    })
  })
})

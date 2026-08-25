// @vitest-environment node

import {of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createEpicTestStore} from '../../__tests__/fixtures/createEpicTestStore'
import {
  createMockSanityClient,
  mockTransactionCommit,
} from '../../__tests__/fixtures/mockSanityClient'
import {
  foldersActions,
  foldersCreateEpic,
  foldersCurrentFolderEpic,
  foldersDeleteEpic,
  foldersFetchEpic,
  foldersRenameEpic,
} from './index'

describe('foldersDeleteEpic', () => {
  it('deletes only the selected folder, unsets direct asset refs, and promotes child folders', async () => {
    const tx = mockTransactionCommit(undefined)
    const client = createMockSanityClient({
      observable: {
        fetch: vi.fn(() => of({assets: [{_id: 'asset-in-folder'}]})),
      },
      transaction: vi.fn(() => tx),
    })

    const store = createEpicTestStore(foldersDeleteEpic, client, {
      assets: {
        assetTypes: ['image'],
        allIds: [],
        byIds: {},
        excludeTagSlugs: [],
        fetchCount: -1,
        fetching: false,
        order: {_updatedAt: 'desc'} as never,
        pageIndex: 0,
        pageSize: 100,
        view: 'grid',
      },
      folders: {
        byId: {
          parent: {_id: 'parent', name: 'Parent', parentId: null},
          target: {_id: 'target', name: 'Target', parentId: 'parent'},
          child: {_id: 'child', name: 'Child', parentId: 'target'},
        },
        childrenByParentId: {
          parent: ['target'],
          target: ['child'],
        },
        rootIds: ['parent'],
        exactCountByFolderId: {},
        unfiledCount: 0,
        currentFolderId: 'target',
        currentFolderUnfiled: false,
        panelVisible: false,
        fetching: false,
        fetchCount: -1,
        creating: false,
        renaming: false,
      },
    })

    store.dispatch(foldersActions.deleteRequest({folderId: 'target'}))

    await vi.waitFor(() => {
      expect(client.observable.fetch).toHaveBeenCalledWith(expect.any(String), {folderId: 'target'})
      expect(tx.delete).toHaveBeenCalledTimes(1)
      expect(tx.delete).toHaveBeenCalledWith('target')
      expect(tx.delete).not.toHaveBeenCalledWith('asset-in-folder')
      expect(tx.delete).not.toHaveBeenCalledWith('child')
      expect(tx.commit).toHaveBeenCalled()
    })

    const assetPatch = tx.patch.mock.calls.find(([id]) => id === 'asset-in-folder')?.[1]
    const childPatch = tx.patch.mock.calls.find(([id]) => id === 'child')?.[1]
    const assetUnset = vi.fn().mockReturnThis()
    const childSet = vi.fn().mockReturnThis()

    assetPatch?.({unset: assetUnset})
    childPatch?.({set: childSet})

    expect(assetUnset).toHaveBeenCalledWith(['opt.media.folder'])
    expect(childSet).toHaveBeenCalledWith({
      parent: {_ref: 'parent', _type: 'reference', _weak: true},
    })
    expect(store.getState().folders.currentFolderId).toBeNull()
  })

  it('moves child folders to root when deleting a root folder', async () => {
    const tx = mockTransactionCommit(undefined)
    const client = createMockSanityClient({
      observable: {
        fetch: vi.fn(() => of({assets: []})),
      },
      transaction: vi.fn(() => tx),
    })

    const store = createEpicTestStore(foldersDeleteEpic, client, {
      assets: {
        assetTypes: ['image'],
        allIds: [],
        byIds: {},
        excludeTagSlugs: [],
        fetchCount: -1,
        fetching: false,
        order: {_updatedAt: 'desc'} as never,
        pageIndex: 0,
        pageSize: 100,
        view: 'grid',
      },
      folders: {
        byId: {
          target: {_id: 'target', name: 'Target', parentId: null},
          child: {_id: 'child', name: 'Child', parentId: 'target'},
        },
        childrenByParentId: {
          target: ['child'],
        },
        rootIds: ['target'],
        exactCountByFolderId: {},
        unfiledCount: 0,
        currentFolderId: null,
        currentFolderUnfiled: false,
        panelVisible: false,
        fetching: false,
        fetchCount: -1,
        creating: false,
        renaming: false,
      },
    })

    store.dispatch(foldersActions.deleteRequest({folderId: 'target'}))

    await vi.waitFor(() => {
      expect(tx.commit).toHaveBeenCalled()
    })

    const childPatch = tx.patch.mock.calls.find(([id]) => id === 'child')?.[1]
    const childUnset = vi.fn().mockReturnThis()

    childPatch?.({unset: childUnset})

    expect(childUnset).toHaveBeenCalledWith(['parent'])
  })
})

describe('foldersCurrentFolderEpic', () => {
  it('reloads assets when deleting the currently viewed folder', async () => {
    const tx = mockTransactionCommit(undefined)
    const client = createMockSanityClient({
      observable: {
        fetch: vi.fn(() => of({assets: []})),
      },
      transaction: vi.fn(() => tx),
    })

    const deleteStore = createEpicTestStore(foldersDeleteEpic, client, {
      assets: {
        assetTypes: ['image'],
        allIds: ['asset-1'],
        byIds: {},
        excludeTagSlugs: [],
        fetchCount: 1,
        fetching: false,
        order: {_updatedAt: 'desc'} as never,
        pageIndex: 0,
        pageSize: 100,
        view: 'grid',
      },
      folders: {
        byId: {
          target: {_id: 'target', name: 'Target', parentId: null},
        },
        childrenByParentId: {},
        rootIds: ['target'],
        exactCountByFolderId: {},
        unfiledCount: 0,
        currentFolderId: 'target',
        currentFolderUnfiled: false,
        panelVisible: false,
        fetching: false,
        fetchCount: -1,
        creating: false,
        renaming: false,
      },
    })

    const reloadStore = createEpicTestStore(foldersCurrentFolderEpic, client, {
      assets: deleteStore.getState().assets,
      folders: deleteStore.getState().folders,
    })

    reloadStore.dispatch(
      foldersActions.deleteComplete({
        folderId: 'target',
        deletedIds: ['target'],
        clearedCurrentFolder: true,
      }),
    )

    await vi.waitFor(() => {
      expect(reloadStore.getState().assets.allIds).toEqual([])
      expect(reloadStore.getState().assets.pageIndex).toBe(0)
    })
  })
})

const emptyFoldersState = {
  byId: {} as Record<string, {_id: string; name: string; parentId: string | null}>,
  childrenByParentId: {} as Record<string, string[]>,
  rootIds: [] as string[],
  exactCountByFolderId: {} as Record<string, number>,
  unfiledCount: 0,
  currentFolderId: null as string | null,
  currentFolderUnfiled: false,
  panelVisible: false,
  fetching: false,
  fetchCount: -1,
  creating: false,
  renaming: false,
}

describe('foldersCreateEpic', () => {
  it('creates a root folder and sets it as current', async () => {
    const client = createMockSanityClient({
      observable: {
        create: vi.fn(() => of({_id: 'media.folder.abc'})),
      },
    })

    const store = createEpicTestStore(foldersCreateEpic, client, {
      folders: emptyFoldersState,
    })

    store.dispatch(foldersActions.createRequest({name: '  Campaigns  '}))

    await vi.waitFor(() => {
      expect(client.observable.create).toHaveBeenCalledWith(
        expect.objectContaining({
          _type: 'media.folder',
          name: 'Campaigns',
        }),
      )
      expect(store.getState().folders.creating).toBe(false)
      expect(store.getState().folders.currentFolderId).toMatch(/^media\.folder\./)
    })
  })

  it('rejects empty names', async () => {
    const client = createMockSanityClient()
    const store = createEpicTestStore(foldersCreateEpic, client, {
      folders: emptyFoldersState,
    })

    store.dispatch(foldersActions.createRequest({name: '   '}))

    await vi.waitFor(() => {
      expect(store.getState().folders.creatingError?.statusCode).toBe(400)
      expect(client.observable.create).not.toHaveBeenCalled()
    })
  })

  it('rejects sibling name collisions', async () => {
    const client = createMockSanityClient()
    const store = createEpicTestStore(foldersCreateEpic, client, {
      folders: {
        ...emptyFoldersState,
        byId: {existing: {_id: 'existing', name: 'Campaigns', parentId: null}},
        rootIds: ['existing'],
      },
    })

    store.dispatch(foldersActions.createRequest({name: 'campaigns'}))

    await vi.waitFor(() => {
      expect(store.getState().folders.creatingError?.statusCode).toBe(409)
    })
  })
})

describe('foldersRenameEpic', () => {
  it('renames a folder when the name is available', async () => {
    const chain = {
      set: vi.fn().mockReturnThis(),
      commit: vi.fn().mockResolvedValue({}),
    }
    const client = createMockSanityClient()
    Object.assign(client.observable, {patch: vi.fn(() => chain)})

    const store = createEpicTestStore(foldersRenameEpic, client, {
      folders: {
        ...emptyFoldersState,
        byId: {f1: {_id: 'f1', name: 'Old', parentId: null}},
        rootIds: ['f1'],
      },
    })

    store.dispatch(foldersActions.renameRequest({folderId: 'f1', name: 'New'}))

    await vi.waitFor(() => {
      expect(store.getState().folders.renaming).toBe(false)
      expect(chain.set).toHaveBeenCalledWith({name: 'New'})
      expect(chain.commit).toHaveBeenCalled()
    })
  })

  it('rejects rename when the name is unchanged', async () => {
    const client = createMockSanityClient()
    const store = createEpicTestStore(foldersRenameEpic, client, {
      folders: {
        ...emptyFoldersState,
        byId: {f1: {_id: 'f1', name: 'Same', parentId: null}},
        rootIds: ['f1'],
      },
    })

    store.dispatch(foldersActions.renameRequest({folderId: 'f1', name: 'Same'}))

    await vi.waitFor(() => {
      expect(store.getState().folders.renameError?.statusCode).toBe(400)
    })
  })
})

describe('foldersFetchEpic', () => {
  it('indexes fetched folders and counts', async () => {
    const client = createMockSanityClient({
      observable: {
        fetch: vi.fn(() =>
          of({
            folders: [
              {_id: 'f1', name: 'Root', parentId: null, count: 2},
              {_id: 'f2', name: 'Child', parentId: 'f1', count: 1},
            ],
            unfiledCount: 5,
          }),
        ),
      },
    })

    const store = createEpicTestStore(foldersFetchEpic, client, {
      assets: {
        assetTypes: ['image'],
        allIds: [],
        byIds: {},
        excludeTagSlugs: [],
        fetchCount: -1,
        fetching: false,
        order: {_updatedAt: 'desc'} as never,
        pageIndex: 0,
        pageSize: 100,
        view: 'grid',
      },
      folders: emptyFoldersState,
    })

    store.dispatch(foldersActions.fetchRequest())

    await vi.waitFor(() => {
      expect(store.getState().folders.byId['f1']?.name).toBe('Root')
      expect(store.getState().folders.childrenByParentId['f1']).toEqual(['f2'])
      expect(store.getState().folders.exactCountByFolderId['f1']).toBe(2)
      expect(store.getState().folders.unfiledCount).toBe(5)
      expect(store.getState().folders.fetching).toBe(false)
    })
  })
})

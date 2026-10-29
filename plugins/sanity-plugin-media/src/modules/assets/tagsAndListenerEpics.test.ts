// @vitest-environment node

import {combineEpics} from 'redux-observable'
import {of, Subject, throwError} from 'rxjs'
import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest'

import {createEpicTestStore} from '../../__tests__/fixtures/createEpicTestStore'
import {
  createMockSanityClient,
  mockTransactionCommit,
} from '../../__tests__/fixtures/mockSanityClient'
import type {ImageAsset, Tag} from '../../types'
import {searchActions} from '../search'
import {ASSETS_ACTIONS} from './actions'
import {
  assetsActions,
  assetsListenEpic,
  assetsListenerCreateQueueEpic,
  assetsListenerDeleteQueueEpic,
  assetsListenerUpdateQueueEpic,
  assetsTagsAddEpic,
  assetsTagsRemoveEpic,
} from './index'
import {initialState as assetsInitialState} from './index'

const sampleAsset = {
  _id: 'a1',
  _type: 'sanity.imageAsset',
  _createdAt: '',
  _updatedAt: '',
  _rev: 'r1',
  originalFilename: 'x.png',
  size: 1,
  mimeType: 'image/png',
  url: '',
} as ImageAsset

const sampleTag: Tag = {
  _id: 't1',
  _type: 'media.tag',
  _createdAt: '',
  _updatedAt: '',
  _rev: 'tr',
  name: {_type: 'slug', current: 'tag-a'},
}

describe('assetsTagsAddEpic', () => {
  it('runs transaction.commit when adding tag to picked assets', async () => {
    const tx = mockTransactionCommit(undefined)
    const client = createMockSanityClient({
      transaction: vi.fn(() => tx),
    })

    const assetItem = {
      _type: 'asset' as const,
      asset: sampleAsset,
      picked: true,
      updating: false,
    }

    const store = createEpicTestStore(assetsTagsAddEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {a1: assetItem},
      },
      tags: {
        allIds: ['t1'],
        byIds: {
          t1: {_type: 'tag', tag: sampleTag, picked: false, updating: false},
        },
        creating: false,
        fetchCount: -1,
        fetching: false,
        panelVisible: true,
      },
    })

    store.dispatch(
      ASSETS_ACTIONS.tagsAddRequest({
        assets: [assetItem],
        tag: sampleTag,
      }),
    )

    await vi.waitFor(() => {
      expect(tx.commit).toHaveBeenCalled()
    })
  })
})

describe('assetsTagsRemoveEpic', () => {
  it('runs transaction.commit for tag removal', async () => {
    const tx = mockTransactionCommit(undefined)
    const client = createMockSanityClient({
      transaction: vi.fn(() => tx),
    })

    const assetItem = {
      _type: 'asset' as const,
      asset: sampleAsset,
      picked: true,
      updating: false,
    }

    const store = createEpicTestStore(assetsTagsRemoveEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {a1: assetItem},
      },
      tags: {
        allIds: ['t1'],
        byIds: {
          t1: {_type: 'tag', tag: sampleTag, picked: false, updating: false},
        },
        creating: false,
        fetchCount: -1,
        fetching: false,
        panelVisible: true,
      },
    })

    store.dispatch(
      ASSETS_ACTIONS.tagsRemoveRequest({
        assets: [assetItem],
        tag: sampleTag,
      }),
    )

    await vi.waitFor(() => {
      expect(tx.commit).toHaveBeenCalled()
    })
  })
})

describe('assets listener queue epics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('assetsListenerCreateQueueEpic batches creates after buffer window', async () => {
    const store = createEpicTestStore(assetsListenerCreateQueueEpic, createMockSanityClient(), {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {
          a1: {_type: 'asset', asset: sampleAsset, picked: false, updating: false},
        },
      },
    })

    const updated = {...sampleAsset, title: 'L'}
    store.dispatch(assetsActions.listenerCreateQueue({asset: updated}))

    await vi.advanceTimersByTimeAsync(2000)

    await vi.waitFor(() => {
      expect(store.getState().assets.byIds['a1']!.asset.title).toBe('L')
    })
  })

  it('assetsListenerCreateQueueEpic does not query for assets the store already has', async () => {
    const fetch = vi.fn((_query: string) => of([]))
    const client = createMockSanityClient({observable: {fetch}})
    const store = createEpicTestStore(assetsListenerCreateQueueEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {
          a1: {_type: 'asset', asset: sampleAsset, picked: false, updating: false},
        },
      },
    })

    store.dispatch(assetsActions.listenerCreateQueue({asset: sampleAsset}))
    await vi.advanceTimersByTimeAsync(2000)

    expect(fetch).not.toHaveBeenCalled()
    expect(store.getState().assets.allIds).toEqual(['a1'])
  })

  it('assetsListenerCreateQueueEpic adds a new asset that matches the current filter', async () => {
    const newer = {...sampleAsset, _id: 'a2', _createdAt: '2026-01-02'} as ImageAsset
    const filteredOut = {...sampleAsset, _id: 'a3', _createdAt: '2026-01-03'} as ImageAsset
    const older = {...sampleAsset, _createdAt: '2026-01-01'}
    // The server reports which of the unknown assets match the browser's current filter
    const fetch = vi.fn((_query: string) => of(['a2']))
    const client = createMockSanityClient({observable: {fetch}})
    const store = createEpicTestStore(assetsListenerCreateQueueEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {
          a1: {_type: 'asset', asset: older, picked: true, updating: false},
        },
        // A page load is in flight and the user has paged past the first page
        fetching: true,
        pageIndex: 2,
      },
    })

    store.dispatch(assetsActions.listenerCreateQueue({asset: newer}))
    store.dispatch(assetsActions.listenerCreateQueue({asset: filteredOut}))
    await vi.advanceTimersByTimeAsync(2000)

    await vi.waitFor(() => {
      expect(store.getState().assets.allIds).toEqual(['a2', 'a1'])
    })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0]![0]).toContain('_id in $ids')
    expect(store.getState().assets.byIds['a2']!.asset).toEqual(newer)
    expect(store.getState().assets.byIds['a3']).toBeUndefined()
    // Nothing else about the grid changed: the selection, the page load in flight, the cursor
    expect(store.getState().assets.byIds['a1']!.picked).toBe(true)
    expect(store.getState().assets.fetching).toBe(true)
    expect(store.getState().assets.pageIndex).toBe(2)
  })

  it('assetsListenerCreateQueueEpic does not insert matches after the filter changes', async () => {
    const refreshed = {...sampleAsset, title: 'L'}
    const newer = {...sampleAsset, _id: 'a2', _createdAt: '2026-01-02'} as ImageAsset
    const fetchResults = new Subject<string[]>()
    const fetch = vi.fn((_query: string) => fetchResults.asObservable())
    const client = createMockSanityClient({observable: {fetch}})
    const store = createEpicTestStore(assetsListenerCreateQueueEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {
          a1: {_type: 'asset', asset: sampleAsset, picked: false, updating: false},
        },
      },
    })

    store.dispatch(assetsActions.listenerCreateQueue({asset: refreshed}))
    store.dispatch(assetsActions.listenerCreateQueue({asset: newer}))
    await vi.advanceTimersByTimeAsync(2000)

    expect(fetch).toHaveBeenCalledTimes(1)

    // A search change clears the grid while the filter check for the old view is still open
    store.dispatch(searchActions.querySet({searchQuery: 'cats'}))
    store.dispatch(assetsActions.clear())
    fetchResults.next(['a2'])
    fetchResults.complete()

    await vi.waitFor(() => {
      expect(store.getState().assets.byIds['a1']!.asset.title).toBe('L')
    })
    expect(store.getState().assets.allIds).toEqual([])
    expect(store.getState().assets.byIds['a2']).toBeUndefined()
  })

  it('assetsListenerCreateQueueEpic still refreshes known assets when the filter check fails', async () => {
    const fetch = vi.fn((_query: string) => throwError(() => new Error('offline')))
    const client = createMockSanityClient({observable: {fetch}})
    const store = createEpicTestStore(assetsListenerCreateQueueEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {
          a1: {_type: 'asset', asset: sampleAsset, picked: false, updating: false},
        },
      },
    })
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    store.dispatch(assetsActions.listenerCreateQueue({asset: {...sampleAsset, title: 'L'}}))
    store.dispatch(
      assetsActions.listenerCreateQueue({asset: {...sampleAsset, _id: 'a2'} as ImageAsset}),
    )
    await vi.advanceTimersByTimeAsync(2000)

    await vi.waitFor(() => {
      expect(store.getState().assets.byIds['a1']!.asset.title).toBe('L')
    })
    expect(store.getState().assets.allIds).toEqual(['a1'])
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })

  it('assetsListenerDeleteQueueEpic batches deletes', async () => {
    const store = createEpicTestStore(assetsListenerDeleteQueueEpic, createMockSanityClient(), {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {
          a1: {_type: 'asset', asset: sampleAsset, picked: false, updating: false},
        },
      },
    })

    store.dispatch(assetsActions.listenerDeleteQueue({assetId: 'a1'}))
    await vi.advanceTimersByTimeAsync(2000)

    await vi.waitFor(() => {
      expect(store.getState().assets.byIds['a1']).toBeUndefined()
    })
  })

  it('assetsListenerUpdateQueueEpic batches updates', async () => {
    const store = createEpicTestStore(assetsListenerUpdateQueueEpic, createMockSanityClient(), {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {
          a1: {_type: 'asset', asset: sampleAsset, picked: false, updating: false},
        },
      },
    })

    const updated = {...sampleAsset, title: 'Buffered'}
    store.dispatch(assetsActions.listenerUpdateQueue({asset: updated}))
    await vi.advanceTimersByTimeAsync(2000)

    await vi.waitFor(() => {
      expect(store.getState().assets.byIds['a1']!.asset.title).toBe('Buffered')
    })
  })
})

describe('assetsListenEpic', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('feeds asset mutations into the listener queues', async () => {
    const events = new Subject<{documentId: string; result?: unknown; transition: string}>()
    const listen = vi.fn((_query: string) => events)
    const store = createEpicTestStore(
      combineEpics(assetsListenEpic, assetsListenerUpdateQueueEpic, assetsListenerDeleteQueueEpic),
      createMockSanityClient({listen}),
      {
        assets: {
          ...assetsInitialState,
          assetTypes: ['image'],
          allIds: ['a1'],
          byIds: {
            a1: {_type: 'asset', asset: sampleAsset, picked: false, updating: false},
          },
        },
      },
    )

    store.dispatch(assetsActions.listenRequest())
    expect(listen).toHaveBeenCalledTimes(1)
    expect(listen.mock.calls[0]![0]).toContain('sanity.imageAsset')

    events.next({
      documentId: 'a1',
      result: {...sampleAsset, title: 'Listened'},
      transition: 'update',
    })
    await vi.advanceTimersByTimeAsync(2000)
    expect(store.getState().assets.byIds['a1']!.asset.title).toBe('Listened')

    events.next({documentId: 'a1', transition: 'disappear'})
    await vi.advanceTimersByTimeAsync(2000)
    expect(store.getState().assets.byIds['a1']).toBeUndefined()
  })

  it('keeps the other epics running when the listener fails', async () => {
    const events = new Subject<{documentId: string; result?: unknown; transition: string}>()
    const listen = vi.fn((_query: string) => events)
    const store = createEpicTestStore(
      combineEpics(assetsListenEpic, assetsListenerDeleteQueueEpic),
      createMockSanityClient({listen}),
      {
        assets: {
          ...assetsInitialState,
          assetTypes: ['image'],
          allIds: ['a1'],
          byIds: {
            a1: {_type: 'asset', asset: sampleAsset, picked: false, updating: false},
          },
        },
      },
    )
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    store.dispatch(assetsActions.listenRequest())
    events.error(new Error('listener gone'))
    expect(error).toHaveBeenCalledWith(new Error('listener gone'))

    store.dispatch(assetsActions.listenerDeleteQueue({assetId: 'a1'}))
    await vi.advanceTimersByTimeAsync(2000)
    expect(store.getState().assets.byIds['a1']).toBeUndefined()

    error.mockRestore()
  })

  it('excludes Media Library assets from the listener when they are hidden', () => {
    const listen = vi.fn((_query: string) => new Subject())
    const store = createEpicTestStore(assetsListenEpic, createMockSanityClient({listen}), {
      assets: {...assetsInitialState, assetTypes: ['image'], showMediaLibraryAssets: false},
    })

    store.dispatch(assetsActions.listenRequest())

    expect(listen.mock.calls[0]![0]).toContain('source.name')
  })
})

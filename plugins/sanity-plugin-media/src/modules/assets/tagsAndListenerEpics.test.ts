// @vitest-environment node

import {combineEpics} from 'redux-observable'
import {Subject} from 'rxjs'
import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest'

import {createEpicTestStore} from '../../__tests__/fixtures/createEpicTestStore'
import {
  createMockSanityClient,
  mockTransactionCommit,
} from '../../__tests__/fixtures/mockSanityClient'
import type {ImageAsset, Tag} from '../../types'
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

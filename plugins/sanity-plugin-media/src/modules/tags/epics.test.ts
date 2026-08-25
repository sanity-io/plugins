// @vitest-environment node

import {of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createEpicTestStore} from '../../__tests__/fixtures/createEpicTestStore'
import {
  createMockSanityClient,
  mockTransactionCommit,
} from '../../__tests__/fixtures/mockSanityClient'
import type {Tag} from '../../types'
import {tagsCreateEpic, tagsDeleteEpic, tagsFetchEpic, tagsUpdateEpic, tagsActions} from './index'

const sampleTag: Tag = {
  _id: 't1',
  _type: 'media.tag',
  _createdAt: '',
  _updatedAt: '',
  _rev: 'tr',
  name: {_type: 'slug', current: 'alpha'},
}

describe('tagsCreateEpic', () => {
  it('creates tag when checkTagName passes', async () => {
    const client = createMockSanityClient({
      fetch: vi.fn().mockResolvedValue(0),
      observable: {
        create: vi.fn(() => of(sampleTag)),
      },
    })

    const store = createEpicTestStore(tagsCreateEpic, client)
    store.dispatch(tagsActions.createRequest({name: 'alpha'}))

    await vi.waitFor(() => {
      expect(store.getState().tags.byIds['t1']?.tag).toEqual(sampleTag)
      expect(client.observable.create).toHaveBeenCalled()
    })
  })

  it('dispatches createError when tag exists', async () => {
    const client = createMockSanityClient({
      fetch: vi.fn().mockResolvedValue(1),
      observable: {
        create: vi.fn(() => of(sampleTag)),
      },
    })

    const store = createEpicTestStore(tagsCreateEpic, client)
    store.dispatch(tagsActions.createRequest({name: 'dup'}))

    await vi.waitFor(() => {
      expect(store.getState().tags.creatingError?.statusCode).toBe(409)
      expect(client.observable.create).not.toHaveBeenCalled()
    })
  })
})

describe('tagsDeleteEpic', () => {
  it('fetches referencing assets and commits transaction', async () => {
    const tx = mockTransactionCommit(undefined)
    const client = createMockSanityClient({
      observable: {
        fetch: vi.fn(() =>
          of([
            {_id: 'a1', _rev: 'r1', opt: {}},
            {_id: 'a2', _rev: 'r2', opt: {}},
          ]),
        ),
      },
      transaction: vi.fn(() => tx),
    })

    const store = createEpicTestStore(tagsDeleteEpic, client, {
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

    store.dispatch(tagsActions.deleteRequest({tag: sampleTag}))

    await vi.waitFor(() => {
      expect(tx.patch).toHaveBeenCalled()
      expect(tx.delete).toHaveBeenCalledWith('t1')
      expect(tx.commit).toHaveBeenCalled()
      expect(store.getState().tags.byIds['t1']).toBeUndefined()
    })
  })
})

describe('tagsFetchEpic', () => {
  it('stores fetched tags on fetchComplete', async () => {
    const client = createMockSanityClient({
      observable: {
        fetch: vi.fn(() => of({items: [sampleTag]})),
      },
    })

    const store = createEpicTestStore(tagsFetchEpic, client)
    store.dispatch(tagsActions.fetchRequest())

    await vi.waitFor(() => {
      expect(store.getState().tags.byIds['t1']?.tag).toEqual(sampleTag)
      expect(store.getState().tags.fetching).toBe(false)
      expect(store.getState().tags.fetchCount).toBe(1)
    })
  })
})

describe('tagsUpdateEpic', () => {
  it('patches the tag name when available', async () => {
    const updated = {...sampleTag, name: {_type: 'slug' as const, current: 'beta'}}
    const chain = {
      set: vi.fn().mockReturnThis(),
      commit: vi.fn().mockResolvedValue(updated),
    }
    const client = createMockSanityClient({
      fetch: vi.fn().mockResolvedValue(0),
      patch: vi.fn(() => chain),
    })

    const store = createEpicTestStore(tagsUpdateEpic, client, {
      tags: {
        allIds: ['t1'],
        byIds: {
          t1: {_type: 'tag', tag: sampleTag, picked: false, updating: false},
        },
        creating: false,
        fetchCount: 1,
        fetching: false,
        panelVisible: true,
      },
    })

    store.dispatch(
      tagsActions.updateRequest({
        formData: {name: {_type: 'slug', current: 'beta'}},
        tag: sampleTag,
      }),
    )

    await vi.waitFor(() => {
      expect(client.patch).toHaveBeenCalledWith('t1')
      expect(chain.set).toHaveBeenCalledWith({name: {_type: 'slug', current: 'beta'}})
      expect(store.getState().tags.byIds['t1']?.tag.name.current).toBe('beta')
    })
  })

  it('dispatches updateError when the name already exists', async () => {
    const client = createMockSanityClient({
      fetch: vi.fn().mockResolvedValue(1),
    })

    const store = createEpicTestStore(tagsUpdateEpic, client, {
      tags: {
        allIds: ['t1'],
        byIds: {
          t1: {_type: 'tag', tag: sampleTag, picked: false, updating: false},
        },
        creating: false,
        fetchCount: 1,
        fetching: false,
        panelVisible: true,
      },
    })

    store.dispatch(
      tagsActions.updateRequest({
        formData: {name: {_type: 'slug', current: 'dup'}},
        tag: sampleTag,
      }),
    )

    await vi.waitFor(() => {
      expect(store.getState().tags.byIds['t1']?.error?.statusCode).toBe(409)
      expect(client.patch).not.toHaveBeenCalled()
    })
  })
})

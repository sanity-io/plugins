// @vitest-environment node

import {combineEpics} from 'redux-observable'
import {of, throwError} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createEpicTestStore} from '../../__tests__/fixtures/createEpicTestStore'
import {createMockSanityClient} from '../../__tests__/fixtures/mockSanityClient'
import type {ImageAsset} from '../../types'
import {assetsActions, assetsFetchEpic, assetsFetchPageIndexEpic, initialState} from './index'

function assertFetchSucceeded(store: ReturnType<typeof createEpicTestStore>, asset: ImageAsset) {
  expect(store.getState().assets.byIds['a1']?.asset).toEqual(asset)
  expect(store.getState().assets.fetching).toBe(false)
}

function assertFetchFailed(store: ReturnType<typeof createEpicTestStore>) {
  expect(store.getState().assets.fetchingError?.message).toBe('boom')
}

const sampleAsset = {
  _id: 'a1',
  _type: 'sanity.imageAsset',
  _createdAt: '',
  _updatedAt: '',
  _rev: 'r',
  originalFilename: 'x.png',
  size: 1,
  mimeType: 'image/png',
  url: '',
} as ImageAsset

describe('assetsFetchEpic', () => {
  it('dispatches fetchComplete when observable.fetch succeeds', async () => {
    const client = createMockSanityClient({
      observable: {
        fetch: vi.fn(() => of({items: [sampleAsset]})),
      },
    })

    const store = createEpicTestStore(assetsFetchEpic, client)
    store.dispatch(
      assetsActions.fetchRequest({
        params: {},
        queryFilter: '_type == "sanity.imageAsset"',
        selector: '',
        sort: '',
      }),
    )

    await vi.waitFor(() => assertFetchSucceeded(store, sampleAsset))
  })

  it('dispatches fetchError when fetch fails', async () => {
    const fetchErr = throwError(() => ({message: 'boom', statusCode: 500}))
    const client = createMockSanityClient({
      observable: {
        fetch: vi.fn(() => fetchErr),
      },
    })

    const store = createEpicTestStore(assetsFetchEpic, client)
    store.dispatch(
      assetsActions.fetchRequest({
        params: {},
        queryFilter: '_type == "sanity.imageAsset"',
        selector: '',
        sort: '',
      }),
    )

    await vi.waitFor(() => assertFetchFailed(store))
  })
})

describe('assetsFetchPageIndexEpic', () => {
  it('searches each configured locale when loading a page', async () => {
    const fetch = vi.fn((_query: string) => of({items: []}))
    const client = createMockSanityClient({
      observable: {fetch},
    })

    const store = createEpicTestStore(
      combineEpics(assetsFetchPageIndexEpic, assetsFetchEpic),
      client,
      {
        assets: {
          ...initialState,
          assetTypes: ['image', 'file'],
          localeIds: ['en', 'zh-CN'],
        },
        search: {facets: [], query: 'faucet'},
      },
    )

    store.dispatch(assetsActions.loadPageIndex({pageIndex: 0}))

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })

    const query = fetch.mock.calls[0]?.[0] ?? ''
    expect(query).toContain('altText["en"]')
    expect(query).toContain('altText["zh-CN"]')
    expect(query).toContain("match '*faucet*'")
  })
})

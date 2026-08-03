import type {AxiosRequestConfig} from 'axios'
import {expect, test, vi} from 'vitest'

import {fetchAssets} from './datastores/shopify'

const axiosGet = vi.hoisted(() =>
  vi.fn((_url: string, _config?: AxiosRequestConfig) =>
    Promise.resolve({data: {assets: [], pageInfo: {cursor: '', hasNextPage: false}}}),
  ),
)

vi.mock('axios', () => ({
  default: {
    get: axiosGet,
  },
}))

test('fetchAssets includes query and cursor search params', async () => {
  await fetchAssets({
    projectId: 'project',
    dataset: 'dataset',
    shop: 'example.myshopify.com',
    query: 'abc',
    cursor: 'cursor-1',
    resultsPerPage: 42,
    token: 'token',
  })

  expect(axiosGet).toHaveBeenCalledTimes(1)
  expect(axiosGet.mock.calls[0]?.[0]).toContain('shop=example.myshopify.com')
  expect(axiosGet.mock.calls[0]?.[0]).toContain('query=abc')
  expect(axiosGet.mock.calls[0]?.[0]).toContain('cursor=cursor-1')
  expect(axiosGet.mock.calls[0]?.[0]).toContain('limit=42')
  expect(axiosGet.mock.calls[0]?.[1]?.headers).toMatchObject({
    Authorization: 'Bearer token',
  })
})

test('fetchAssets omits empty query and cursor params', async () => {
  axiosGet.mockClear()

  await fetchAssets({
    projectId: 'project',
    dataset: 'dataset',
    shop: 'example.myshopify.com',
    query: '  ',
    cursor: '',
    resultsPerPage: 42,
  })

  expect(axiosGet.mock.calls[0]?.[0]).not.toContain('query=')
  expect(axiosGet.mock.calls[0]?.[0]).not.toContain('cursor=')
  expect(axiosGet.mock.calls[0]?.[1]?.headers).toEqual({})
})

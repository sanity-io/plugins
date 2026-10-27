import {BehaviorSubject} from 'rxjs'
import {expect, test, vi} from 'vitest'

import {search} from './datastores/shopify'

const {axiosGet} = vi.hoisted(() => ({
  axiosGet: vi.fn(() =>
    Promise.resolve({data: {assets: [], pageInfo: {cursor: '', hasNextPage: false}}}),
  ),
}))

vi.mock('axios', () => ({
  default: {
    get: axiosGet,
  },
}))

// The picker clears its results and sets its loading state before pushing to
// these subjects, so `search` must emit for every push. Deduplicating repeated
// [query, cursor] pairs would leave the picker stuck loading on an empty grid.
test('emits again when a query settles back to the previous value', async () => {
  vi.useFakeTimers()

  const query = new BehaviorSubject('')
  const cursor = new BehaviorSubject('')
  const emissions: unknown[] = []

  const subscription = search({
    projectId: 'project',
    dataset: 'dataset',
    shop: 'example.myshopify.com',
    query,
    cursor,
    resultsPerPage: 42,
  }).subscribe((results) => emissions.push(results))

  cursor.next('')
  query.next('abc')
  await vi.advanceTimersByTimeAsync(600)
  expect(emissions).toHaveLength(1)

  // A typo corrected back to the previous query within the debounce window
  cursor.next('')
  query.next('abcd')
  cursor.next('')
  query.next('abc')
  await vi.advanceTimersByTimeAsync(600)

  expect(emissions).toHaveLength(2)

  subscription.unsubscribe()
  vi.useRealTimers()
})

test('requests assets from the configured dataset', async () => {
  vi.useFakeTimers()
  axiosGet.mockClear()

  const query = new BehaviorSubject('')
  const cursor = new BehaviorSubject('')

  const subscription = search({
    projectId: 'project',
    dataset: 'production',
    shop: 'example.myshopify.com',
    query,
    cursor,
    resultsPerPage: 42,
  }).subscribe(() => {})

  await vi.advanceTimersByTimeAsync(600)

  expect(axiosGet).toHaveBeenCalledWith(
    'https://project.api.sanity.io/v1/shopify/assets/production?shop=example.myshopify.com&limit=42',
    expect.objectContaining({method: 'GET'}),
  )

  subscription.unsubscribe()
  vi.useRealTimers()
})

test('encodes the dataset path segment', async () => {
  vi.useFakeTimers()
  axiosGet.mockClear()

  const query = new BehaviorSubject('')
  const cursor = new BehaviorSubject('')

  const subscription = search({
    projectId: 'project',
    dataset: 'prod/extra',
    shop: 'example.myshopify.com',
    query,
    cursor,
    resultsPerPage: 42,
  }).subscribe(() => {})

  await vi.advanceTimersByTimeAsync(600)

  expect(axiosGet).toHaveBeenCalledWith(
    'https://project.api.sanity.io/v1/shopify/assets/prod%2Fextra?shop=example.myshopify.com&limit=42',
    expect.objectContaining({method: 'GET'}),
  )

  subscription.unsubscribe()
  vi.useRealTimers()
})

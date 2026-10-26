import {BehaviorSubject} from 'rxjs'
import {afterEach, beforeEach, expect, test, vi} from 'vitest'

import {search} from './datastores/shopify'

const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
  Promise.resolve(Response.json({assets: [], pageInfo: {cursor: '', hasNextPage: false}})),
)

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
  vi.useRealTimers()
})

function searchWith(token?: string) {
  const query = new BehaviorSubject('')
  const cursor = new BehaviorSubject('')
  const emissions: unknown[] = []
  const errors: unknown[] = []

  const subscription = search({
    projectId: 'project',
    dataset: 'dataset',
    shop: 'example.myshopify.com',
    query,
    cursor,
    resultsPerPage: 42,
    token,
  }).subscribe({next: (results) => emissions.push(results), error: (err) => errors.push(err)})

  return {query, cursor, emissions, errors, subscription}
}

// The picker clears its results and sets its loading state before pushing to
// these subjects, so `search` must emit for every push. Deduplicating repeated
// [query, cursor] pairs would leave the picker stuck loading on an empty grid.
test('emits again when a query settles back to the previous value', async () => {
  vi.useFakeTimers()
  const {query, cursor, emissions, subscription} = searchWith()

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
})

test('sends cookies and the token to the Shopify assets endpoint', async () => {
  vi.useFakeTimers()
  const {query, emissions, subscription} = searchWith('secret')

  query.next('shoe')
  await vi.advanceTimersByTimeAsync(600)

  expect(emissions).toEqual([{assets: [], pageInfo: {cursor: '', hasNextPage: false}}])
  expect(fetchMock).toHaveBeenCalledTimes(1)
  const [url, init] = fetchMock.mock.calls[0]!
  expect(url).toBe(
    'https://project.api.sanity.io/v1/shopify/assets/dataset?shop=example.myshopify.com&query=shoe&limit=42',
  )
  expect(init).toMatchObject({
    credentials: 'include',
    headers: {Authorization: 'Bearer secret'},
  })

  subscription.unsubscribe()
})

test('errors with the message from the API response body', async () => {
  vi.useFakeTimers()
  fetchMock.mockImplementationOnce(() =>
    Promise.resolve(Response.json({message: 'Shop not connected'}, {status: 400})),
  )
  const {query, emissions, errors, subscription} = searchWith()

  query.next('shoe')
  await vi.advanceTimersByTimeAsync(600)

  expect(emissions).toEqual([])
  expect(errors).toEqual([new Error('Shop not connected')])

  subscription.unsubscribe()
})

test('falls back to the status code when the error body has no message', async () => {
  vi.useFakeTimers()
  fetchMock.mockImplementationOnce(() =>
    Promise.resolve(new Response('Bad Gateway', {status: 502})),
  )
  const {query, errors, subscription} = searchWith()

  query.next('shoe')
  await vi.advanceTimersByTimeAsync(600)

  expect(errors).toEqual([new Error('Request failed with status code 502')])

  subscription.unsubscribe()
})

test('aborts the in-flight request when a newer query supersedes it', async () => {
  vi.useFakeTimers()
  let firstSignal: AbortSignal | undefined
  fetchMock.mockImplementationOnce((_url, init) => {
    firstSignal = init?.signal ?? undefined
    return new Promise(() => {})
  })
  const {query, emissions, subscription} = searchWith()

  query.next('sho')
  await vi.advanceTimersByTimeAsync(600)
  expect(firstSignal?.aborted).toBe(false)

  query.next('shoe')
  await vi.advanceTimersByTimeAsync(600)

  expect(firstSignal?.aborted).toBe(true)
  expect(emissions).toHaveLength(1)

  subscription.unsubscribe()
})

import {act, renderHook} from '@testing-library/react'
import {config, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {useListeningQuery} from './useListeningQuery'

const listeners: Subject<unknown>[] = []
const listenQuery = vi.fn(() => {
  const listener = new Subject<unknown>()
  listeners.push(listener)

  return listener
})

// The Studio hands out one document store per workspace, and the hook resubscribes when its
// identity changes, so the mock has to be just as stable
const documentStore = {listenQuery}

vi.mock('sanity', () => ({
  useDocumentStore: () => documentStore,
}))

const QUERY = '*[_type == $type]'
const PARAMS = {type: 'pet'}

function renderListeningQuery() {
  return renderHook(() => useListeningQuery<{title: string}[]>(QUERY, {params: PARAMS}))
}

function getListener(index: number): Subject<unknown> {
  const listener = listeners[index]
  if (!listener) {
    throw new Error(
      `listenQuery() has been called ${listeners.length} times, expected at least ${index + 1}`,
    )
  }

  return listener
}

function advanceTimers(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function runPendingTimers() {
  act(() => {
    vi.runOnlyPendingTimers()
  })
}

function connectionError() {
  return new Error('Could not establish EventSource connection')
}

/** Shaped like the errors `@sanity/client` emits, without depending on it */
function clientError(name: string, props: Record<string, unknown> = {}): Error {
  return Object.assign(new Error(`${name} from @sanity/client`), {name}, props)
}

describe('useListeningQuery', () => {
  const onUnhandledError = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    config.onUnhandledError = onUnhandledError
  })

  afterEach(() => {
    config.onUnhandledError = null
    listeners.length = 0
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('returns results from the listener', () => {
    const {result, unmount} = renderListeningQuery()
    expect(result.current).toEqual({data: null, loading: true, error: null})

    act(() => getListener(0).next([{title: 'Rex'}]))

    expect(result.current).toEqual({data: [{title: 'Rex'}], loading: false, error: null})
    unmount()
  })

  test('reports a failed listener without throwing', () => {
    const {result, unmount} = renderListeningQuery()
    const error = connectionError()

    act(() => getListener(0).error(error))
    runPendingTimers()

    expect(onUnhandledError).not.toHaveBeenCalled()
    expect(result.current).toEqual({data: null, loading: false, error})
    unmount()
  })

  test('keeps the last result while the listener is failing', () => {
    const {result, unmount} = renderListeningQuery()
    const data = [{title: 'Rex'}]
    const error = connectionError()

    act(() => getListener(0).next(data))
    act(() => getListener(0).error(error))

    expect(result.current).toEqual({data, loading: false, error})
    expect(result.current.data).toBe(data)
    unmount()
  })

  test('reconnects after a failure and recovers', () => {
    const {result, unmount} = renderListeningQuery()
    const data = [{title: 'Rex'}]

    act(() => getListener(0).next(data))
    act(() => getListener(0).error(connectionError()))
    advanceTimers(2000)

    expect(listenQuery).toHaveBeenCalledTimes(2)
    expect(listenQuery).toHaveBeenLastCalledWith(QUERY, PARAMS, {apiVersion: 'v2023-05-01'})

    // An unchanged result keeps its reference, so consumers don't re-render on reconnect
    act(() => getListener(1).next([{title: 'Rex'}]))
    expect(result.current).toEqual({data, loading: false, error: null})
    expect(result.current.data).toBe(data)

    act(() => getListener(1).next([{title: 'Fido'}]))
    expect(result.current.data).toEqual([{title: 'Fido'}])
    unmount()
  })

  test('backs off between reconnects, and starts over after a successful one', () => {
    const {unmount} = renderListeningQuery()

    act(() => getListener(0).error(connectionError()))
    advanceTimers(1999)
    expect(listenQuery).toHaveBeenCalledTimes(1)
    advanceTimers(1)
    expect(listenQuery).toHaveBeenCalledTimes(2)

    act(() => getListener(1).error(connectionError()))
    advanceTimers(3999)
    expect(listenQuery).toHaveBeenCalledTimes(2)
    advanceTimers(1)
    expect(listenQuery).toHaveBeenCalledTimes(3)

    act(() => getListener(2).next([]))
    act(() => getListener(2).error(connectionError()))
    advanceTimers(2000)
    expect(listenQuery).toHaveBeenCalledTimes(4)
    unmount()
  })

  test.each([
    [
      'a ChannelError for a bad query',
      clientError('ChannelError', {
        data: {error: {type: 'queryParseError', description: 'Expected end of query'}},
      }),
    ],
    ['a DisconnectError', clientError('DisconnectError')],
    ['a query parse error', clientError('ClientError', {statusCode: 400})],
    ['a rejected listener connection', clientError('ConnectionFailedError', {status: 401})],
  ])('stops on %s, since reconnecting would fail the same way', (_name, error) => {
    const {result, unmount} = renderListeningQuery()

    act(() => getListener(0).next([{title: 'Rex'}]))
    act(() => getListener(0).error(error))
    advanceTimers(60_000)

    expect(listenQuery).toHaveBeenCalledTimes(1)
    expect(onUnhandledError).not.toHaveBeenCalled()
    expect(result.current).toEqual({data: [{title: 'Rex'}], loading: false, error})
    unmount()
  })

  test.each([
    [
      'a ChannelError for an internal error',
      clientError('ChannelError', {
        data: {error: {type: 'internalError', description: 'Internal error'}},
      }),
    ],
    // How the listen endpoint sends errors it doesn't recognize
    [
      'a ChannelError without an error type',
      clientError('ChannelError', {data: {error: {description: 'Internal error'}}}),
    ],
    ['a server error', clientError('ServerError', {statusCode: 502})],
    ['a rate limit', clientError('ClientError', {statusCode: 429})],
    ['a request timeout', clientError('ClientError', {statusCode: 408})],
    ['a failed listener connection without a status', clientError('ConnectionFailedError')],
  ])('reconnects after %s', (_name, error) => {
    const {result, unmount} = renderListeningQuery()

    act(() => getListener(0).error(error))
    expect(result.current.error).toBe(error)
    advanceTimers(2000)

    expect(listenQuery).toHaveBeenCalledTimes(2)
    unmount()
  })

  test('listens again when the params change after an error it stopped on', () => {
    const {rerender, result, unmount} = renderHook(
      ({type}) => useListeningQuery<{title: string}[]>(QUERY, {params: {type}}),
      {initialProps: {type: 'pet'}},
    )

    act(() => getListener(0).error(clientError('ClientError', {statusCode: 400})))
    rerender({type: 'toy'})
    act(() => getListener(1).next([{title: 'Ball'}]))

    expect(listenQuery).toHaveBeenLastCalledWith(QUERY, {type: 'toy'}, {apiVersion: 'v2023-05-01'})
    expect(result.current).toEqual({data: [{title: 'Ball'}], loading: false, error: null})
    unmount()
  })

  test('stops reconnecting on unmount', () => {
    const {unmount} = renderListeningQuery()

    act(() => getListener(0).error(connectionError()))
    unmount()
    advanceTimers(60_000)

    expect(listenQuery).toHaveBeenCalledTimes(1)
  })
})

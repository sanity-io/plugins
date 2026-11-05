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

  test('stops reconnecting on unmount', () => {
    const {unmount} = renderListeningQuery()

    act(() => getListener(0).error(connectionError()))
    unmount()
    advanceTimers(60_000)

    expect(listenQuery).toHaveBeenCalledTimes(1)
  })
})

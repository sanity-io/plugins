import {afterEach, describe, expect, it, vi} from 'vitest'

import {createHttpError, createSelector, delay, toHttpError} from './utils'

afterEach(() => {
  vi.useRealTimers()
})

describe('toHttpError', () => {
  it('keeps the message and status code of client errors', () => {
    expect(toHttpError({message: 'Not found', statusCode: 404})).toEqual({
      message: 'Not found',
      statusCode: 404,
    })
    expect(toHttpError(createHttpError('Conflict', 409))).toEqual({
      message: 'Conflict',
      statusCode: 409,
    })
  })

  it.each([undefined, null, 'boom', {message: '', statusCode: 0}, new Error('')])(
    'falls back to an internal error for %j',
    (error) => {
      expect(toHttpError(error)).toEqual({message: 'Internal error', statusCode: 500})
    },
  )
})

describe('delay', () => {
  it('resolves after the given time', async () => {
    vi.useFakeTimers()
    const resolved = vi.fn()

    const promise = delay(1000).then(resolved)
    await vi.advanceTimersByTimeAsync(999)
    expect(resolved).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await promise
    expect(resolved).toHaveBeenCalled()
  })

  it('rejects once aborted', async () => {
    const controller = new AbortController()
    const promise = delay(1000, controller.signal)

    controller.abort(new Error('Stopped'))

    await expect(promise).rejects.toThrow('Stopped')
    await expect(delay(1000, controller.signal)).rejects.toThrow('Stopped')
  })
})

describe('createSelector', () => {
  it('only recomputes when an input changes', () => {
    const combine = vi.fn((items: number[], factor: number) => items.map((item) => item * factor))
    const select = createSelector(
      (state: {factor: number; items: number[]}) => [state.items, state.factor] as const,
      combine,
    )
    const items = [1, 2]

    const first = select({factor: 2, items})
    expect(select({factor: 2, items})).toBe(first)
    expect(combine).toHaveBeenCalledTimes(1)

    expect(select({factor: 3, items})).toEqual([3, 6])
    expect(select({factor: 3, items: [1, 2]})).toEqual([3, 6])
    expect(combine).toHaveBeenCalledTimes(3)
  })
})

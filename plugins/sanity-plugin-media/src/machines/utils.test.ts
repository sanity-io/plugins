import {renderHook, waitFor} from '@testing-library/react'
import {useActorRef} from '@xstate/react'
import {StrictMode} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {type AnyActorLogic, createActor} from 'xstate'

import {
  createHttpError,
  createSelector,
  delay,
  fromMutation,
  fromRequest,
  toHttpError,
} from './utils'

/** Runs `logic` as the root actor of a component, whose effects strict mode reconnects once. */
function runInStrictMode<TLogic extends AnyActorLogic>(logic: TLogic) {
  return renderHook(() => useActorRef(logic), {wrapper: StrictMode}).result.current
}

/** Resolves with the error of `logic` once it fails. */
function errorOf(logic: AnyActorLogic) {
  const actor = createActor(logic)
  const error = new Promise((resolve) => actor.subscribe({error: resolve}))
  actor.start()
  return error
}

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

describe('fromRequest', () => {
  it('sends the request again when React restarts the actor, ignoring the stopped attempt', async () => {
    const signals: AbortSignal[] = []
    const actor = runInStrictMode(
      fromRequest<number, undefined>(({signal}) => {
        const attempt = signals.push(signal)
        return new Promise<number>((resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason))
          setTimeout(() => resolve(attempt))
        })
      }),
    )

    await waitFor(() => expect(actor.getSnapshot().status).toBe('done'))
    expect(actor.getSnapshot().output).toBe(2)
    expect(signals.map((signal) => signal.aborted)).toEqual([true, false])
  })

  it('fails with the error of the request', async () => {
    const logic = fromRequest(() => Promise.reject(createHttpError('Forbidden', 403)))

    await expect(errorOf(logic)).resolves.toMatchObject({statusCode: 403})
  })
})

describe('fromMutation', () => {
  it('waits for the mutation in flight when React restarts the actor', async () => {
    const mutate = vi.fn(() => new Promise<string>((resolve) => setTimeout(() => resolve('saved'))))
    const actor = runInStrictMode(fromMutation<string, undefined>(mutate))

    await waitFor(() => expect(actor.getSnapshot().status).toBe('done'))
    expect(actor.getSnapshot().output).toBe('saved')
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  it('fails with the error of the mutation', async () => {
    const logic = fromMutation(() => Promise.reject(createHttpError('Conflict', 409)))

    await expect(errorOf(logic)).resolves.toMatchObject({statusCode: 409})
  })
})

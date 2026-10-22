import {type AnyActorRef, fromPromise, type PromiseActorLogic} from 'xstate'

import type {HttpError} from '../types'

type ActorSystem = AnyActorRef['system']

const never = <T>() => new Promise<T>(() => undefined)

/**
 * `fromPromise` for requests that are safe to send again, like fetches.
 *
 * `@xstate/react` stops and then restarts the same actors when React reconnects the effects of
 * their provider (strict mode, Fast Refresh), and a restarted actor sends its request again. As
 * `fromPromise` would settle the restarted actor with the outcome of the stopped attempt (like the
 * error from aborting it), the stopped attempt never settles instead.
 */
export function fromRequest<TOutput, TInput>(
  request: (args: {input: TInput; signal: AbortSignal; system: ActorSystem}) => Promise<TOutput>,
): PromiseActorLogic<TOutput, TInput> {
  return fromPromise<TOutput, TInput>(async ({input, signal, system}) => {
    try {
      const output = await request({input, signal, system})
      return signal.aborted ? never<TOutput>() : output
    } catch (error) {
      if (signal.aborted) {
        return never<TOutput>()
      }
      throw error
    }
  })
}

const pendingMutations = new WeakMap<object, Promise<unknown>>()

/**
 * `fromPromise` for requests that must only be sent once, like mutations: when `@xstate/react`
 * restarts the actor (see `fromRequest`), it waits for the request that is already in flight.
 */
export function fromMutation<TOutput, TInput>(
  mutate: (args: {input: TInput; system: ActorSystem}) => Promise<TOutput>,
): PromiseActorLogic<TOutput, TInput> {
  return fromPromise<TOutput, TInput>(({input, self, system}) => {
    const pending =
      (pendingMutations.get(self) as Promise<TOutput> | undefined) ?? mutate({input, system})
    pendingMutations.set(self, pending)
    return pending
  })
}

/** Normalizes anything thrown by the client (or by an actor) into the shape the UI renders. */
export function toHttpError(error: unknown): HttpError {
  const {message, statusCode} = (error ?? {}) as Partial<HttpError>
  return {
    message: typeof message === 'string' && message ? message : 'Internal error',
    statusCode: typeof statusCode === 'number' && statusCode ? statusCode : 500,
  }
}

export function createHttpError(message: string, statusCode: number): Error & HttpError {
  return Object.assign(new Error(message), {statusCode})
}

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }
    const timeout = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout)
        reject(signal.reason)
      },
      {once: true},
    )
  })
}

/**
 * Memoizes a derived selector on the identity of its inputs, so `useSelector` keeps returning the
 * same reference (and skips re-rendering) until one of the inputs actually changes. Selectors run
 * on every snapshot of the actor they subscribe to, and every subscriber of an actor passes the same
 * snapshot, so a single cache entry is enough.
 */
export function createSelector<
  TArgs extends unknown[],
  const TInputs extends readonly unknown[],
  TResult,
>(
  selectInputs: (...args: TArgs) => TInputs,
  combine: (...inputs: TInputs) => TResult,
): (...args: TArgs) => TResult {
  let lastInputs: TInputs | undefined
  let lastResult: TResult
  return (...args) => {
    const inputs = selectInputs(...args)
    if (
      lastInputs === undefined ||
      inputs.length !== lastInputs.length ||
      inputs.some((input, index) => !Object.is(input, lastInputs![index]))
    ) {
      lastInputs = inputs
      lastResult = combine(...inputs)
    }
    return lastResult
  }
}

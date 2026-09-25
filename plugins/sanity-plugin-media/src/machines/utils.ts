import type {HttpError} from '../types'

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

import {concatMap, defer, type Observable, retry, take, throwError, timeout, timer} from 'rxjs'

export interface BackoffSchedule {
  /** Wait before the first attempt. */
  firstDelayMs: number
  /** Wait before the first retry. Doubles with every further retry, up to `maxDelayMs`. */
  retryDelayMs: number
  /** Longest wait between two attempts. */
  maxDelayMs: number
  /** Give up after this long in total, counted from subscribing. */
  timeoutMs: number
}

export interface RetryWithBackoffOptions extends Pick<
  BackoffSchedule,
  'firstDelayMs' | 'timeoutMs'
> {
  /**
   * How long to wait before retry number `retryCount` (starting at 1) after `error`, or
   * `undefined` to fail with `error` straight away.
   */
  retryDelay: (error: unknown, retryCount: number) => number | undefined
  /** The error to fail with once `timeoutMs` has passed. */
  timeoutError: () => unknown
}

/** The wait before retry number `retryCount` (starting at 1). */
export function backoffDelay(
  retryCount: number,
  {retryDelayMs, maxDelayMs}: Pick<BackoffSchedule, 'retryDelayMs' | 'maxDelayMs'>,
): number {
  return Math.min(retryDelayMs * 2 ** (retryCount - 1), maxDelayMs)
}

/**
 * Subscribes to `attempt()` after `firstDelayMs` and resubscribes after the wait `retryDelay`
 * gives for each error, failing with the error when it gives none. Emits the first value and
 * completes. Fails with `timeoutError()` if nothing has been emitted after `timeoutMs`, cutting
 * off the attempt in flight. Attempts never overlap, and unsubscribing stops any pending wait.
 */
export function retryWithBackoff<T>(
  attempt: () => Observable<T>,
  {firstDelayMs, timeoutMs, retryDelay, timeoutError}: RetryWithBackoffOptions,
): Observable<T> {
  return timer(firstDelayMs).pipe(
    concatMap(() =>
      defer(attempt).pipe(
        retry({
          delay: (error: unknown, retryCount) => {
            const delayMs = retryDelay(error, retryCount)
            return delayMs === undefined ? throwError(() => error) : timer(delayMs)
          },
        }),
      ),
    ),
    take(1),
    timeout({first: timeoutMs, with: () => throwError(timeoutError)}),
  )
}

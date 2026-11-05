import {defer, NEVER, of, throwError} from 'rxjs'
import {TestScheduler} from 'rxjs/testing'
import {describe, expect, test} from 'vitest'

import {backoffDelay, retryWithBackoff, type RetryWithBackoffOptions} from './retryWithBackoff'

const notFound = Object.assign(new Error('Not found'), {statusCode: 404})
const forbidden = Object.assign(new Error('Forbidden'), {statusCode: 403})
const timedOut = new Error('Timed out')

const options: RetryWithBackoffOptions = {
  firstDelayMs: 200,
  retryDelayMs: 200,
  maxDelayMs: 500,
  timeoutMs: 5_000,
  isRetryableError: (error) => error === notFound,
  timeoutError: () => timedOut,
}

function createScheduler() {
  return new TestScheduler((actual, expected) => expect(actual).toEqual(expected))
}

/** An attempt that fails with `errors` in turn, then emits 'a'. Records when each attempt starts. */
function scriptedAttempt(scheduler: TestScheduler, errors: unknown[]) {
  const startedAt: number[] = []
  const attempt = () =>
    defer(() => {
      startedAt.push(scheduler.now())
      const error = errors.shift()
      return error === undefined ? of('a') : throwError(() => error)
    })
  return {attempt, startedAt}
}

describe('backoffDelay', () => {
  test('doubles from the retry delay up to the cap', () => {
    const delays = [1, 2, 3, 4, 5].map((n) =>
      backoffDelay(n, {retryDelayMs: 200, maxDelayMs: 1000}),
    )
    expect(delays).toEqual([200, 400, 800, 1000, 1000])
  })
})

describe('retryWithBackoff', () => {
  test('waits before the first attempt, then emits its result and completes', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {attempt, startedAt} = scriptedAttempt(scheduler, [])
      expectObservable(retryWithBackoff(attempt, options)).toBe('200ms (a|)')
      scheduler.flush()
      expect(startedAt).toEqual([200])
    })
  })

  test('retries retryable errors with doubling waits up to the cap', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {attempt, startedAt} = scriptedAttempt(scheduler, [
        notFound,
        notFound,
        notFound,
        notFound,
      ])
      expectObservable(retryWithBackoff(attempt, options)).toBe('1800ms (a|)')
      scheduler.flush()
      // Waits: 200 first, then 200, 400, 500, 500
      expect(startedAt).toEqual([200, 400, 800, 1300, 1800])
    })
  })

  test('fails straight away on an error that is not retryable', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {attempt, startedAt} = scriptedAttempt(scheduler, [notFound, forbidden])
      expectObservable(retryWithBackoff(attempt, options)).toBe('400ms #', undefined, forbidden)
      scheduler.flush()
      expect(startedAt).toEqual([200, 400])
    })
  })

  test('fails with the timeout error once the overall limit has passed', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {attempt, startedAt} = scriptedAttempt(
        scheduler,
        Array.from({length: 100}, () => notFound),
      )
      expectObservable(retryWithBackoff(attempt, options)).toBe('5000ms #', undefined, timedOut)
      scheduler.flush()
      expect(startedAt.at(-1)).toBeLessThan(5_000)
    })
  })

  test('cuts off an attempt that is still running at the limit', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      expectObservable(retryWithBackoff(() => NEVER, options)).toBe('5000ms #', undefined, timedOut)
    })
  })

  test('unsubscribing stops pending waits', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {attempt, startedAt} = scriptedAttempt(
        scheduler,
        Array.from({length: 100}, () => notFound),
      )
      expectObservable(retryWithBackoff(attempt, options), '^ 1000ms !').toBe('')
      scheduler.flush()
      expect(startedAt).toEqual([200, 400, 800])
    })
  })
})

import {describe, expect, test} from 'vitest'

import {pollWithBackoff, PollTimeoutError} from './pollWithBackoff'

// A fake clock: sleeping moves time forward instantly and records the waits.
function fakeClock() {
  let time = 0
  const waits: number[] = []
  return {
    waits,
    now: () => time,
    sleep: async (ms: number) => {
      waits.push(ms)
      time += ms
    },
  }
}

const notFound = Object.assign(new Error('Not found'), {statusCode: 404})
const forbidden = Object.assign(new Error('Forbidden'), {statusCode: 403})
const is404 = (error: unknown) => (error as {statusCode?: number}).statusCode === 404

describe('pollWithBackoff', () => {
  test('returns the first result without waiting', async () => {
    const clock = fakeClock()
    await expect(pollWithBackoff(async () => 'done', clock)).resolves.toBe('done')
    expect(clock.waits).toEqual([0])
  })

  test('backs off between misses until a result arrives', async () => {
    const clock = fakeClock()
    const results = [undefined, undefined, undefined, 'done']
    const value = await pollWithBackoff(async () => results.shift(), {
      ...clock,
      delaysMs: [0, 500, 1000, 2000],
    })
    expect(value).toBe('done')
    expect(clock.waits).toEqual([0, 500, 1000, 2000])
  })

  test('retries errors that are marked retryable', async () => {
    const clock = fakeClock()
    let calls = 0
    const value = await pollWithBackoff(
      async () => {
        calls++
        if (calls < 3) throw notFound
        return 'done'
      },
      {...clock, isRetryableError: is404},
    )
    expect(value).toBe('done')
    expect(calls).toBe(3)
  })

  test('throws other errors straight away', async () => {
    const clock = fakeClock()
    let calls = 0
    const attempt = async () => {
      calls++
      throw forbidden
    }
    await expect(pollWithBackoff(attempt, {...clock, isRetryableError: is404})).rejects.toBe(
      forbidden,
    )
    expect(calls).toBe(1)
  })

  test('repeats the last delay and gives up at the timeout', async () => {
    const clock = fakeClock()
    const attempt = async () => {
      throw notFound
    }
    const error = await pollWithBackoff(attempt, {
      ...clock,
      isRetryableError: is404,
      delaysMs: [0, 500, 1000, 2000, 4000, 8000],
      timeoutMs: 30_000,
    }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(PollTimeoutError)
    expect((error as PollTimeoutError).lastError).toBe(notFound)
    // 0 + 0.5 + 1 + 2 + 4 + 8 + 8 = 23.5s; another 8s would pass 30s
    expect(clock.waits).toEqual([0, 500, 1000, 2000, 4000, 8000, 8000])
  })
})

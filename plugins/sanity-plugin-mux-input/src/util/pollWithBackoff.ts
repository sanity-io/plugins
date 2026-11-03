export interface PollWithBackoffOptions {
  /** Wait before each attempt. The last value repeats until the timeout. */
  delaysMs?: number[]
  /** Stop starting new attempts after this long. */
  timeoutMs?: number
  /** Which errors to retry. Anything else is thrown straight away. */
  isRetryableError?: (error: unknown) => boolean
  sleep?: (ms: number) => Promise<void>
  now?: () => number
}

export class PollTimeoutError extends Error {
  readonly lastError: unknown

  constructor(message: string, lastError?: unknown) {
    super(message)
    this.name = 'PollTimeoutError'
    this.lastError = lastError
  }
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Calls `attempt` until it resolves to a value other than `undefined`, waiting
 * longer between each call. Errors that `isRetryableError` accepts count as a
 * miss. Rejects with a PollTimeoutError once the next wait would pass the
 * timeout. Calls never overlap: each one finishes before the next is started.
 */
export async function pollWithBackoff<T>(
  attempt: () => Promise<T | undefined>,
  {
    delaysMs = [0, 500, 1000, 2000, 4000, 8000],
    timeoutMs = 30_000,
    isRetryableError = () => false,
    sleep = defaultSleep,
    now = Date.now,
  }: PollWithBackoffOptions = {},
): Promise<T> {
  const deadline = now() + timeoutMs
  let lastError: unknown
  for (let i = 0; ; i++) {
    const delay = delaysMs[Math.min(i, delaysMs.length - 1)] ?? 0
    if (now() + delay > deadline) {
      throw new PollTimeoutError(`Gave up after ${i} attempts`, lastError)
    }
    await sleep(delay)
    try {
      const result = await attempt()
      if (result !== undefined) return result
    } catch (error) {
      if (!isRetryableError(error)) throw error
      lastError = error
    }
  }
}

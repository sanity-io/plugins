/**
 * Errors from the Mux addon API that mean the stored Mux credentials can't be
 * used: Mux rejected them (reported as a 400 or 502 with this message), or
 * none are saved for the dataset.
 */
const INVALID_CREDENTIALS_MESSAGES = [/api\.mux\.com responded with 401\b/, /No MUX secrets found/]

function isInvalidCredentialsError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : ''
  return INVALID_CREDENTIALS_MESSAGES.some((pattern) => pattern.test(message))
}

/** Turns credential failures into the same error a failed credentials check gave. */
export function toUploadError(error: unknown): unknown {
  return isInvalidCredentialsError(error) ? new Error('Invalid credentials') : error
}

/**
 * Whether polling for an upload should try again after this error:
 * - no status code: a network error
 * - 404: the upload isn't available yet
 * - 5xx: a temporary server problem
 */
export function isRetryablePollError(error: unknown): boolean {
  const statusCode = (error as {statusCode?: unknown} | null)?.statusCode
  if (typeof statusCode !== 'number') return true
  return statusCode === 404 || statusCode >= 500
}

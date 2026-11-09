type CredentialsProblem = 'missing' | 'invalid'

/** Codes the Mux addon API can send in the error body's `code` when credentials can't be used. */
export const CREDENTIALS_ERROR_CODES: Record<CredentialsProblem, string> = {
  missing: 'mux_credentials_missing',
  invalid: 'mux_credentials_invalid',
}

/**
 * Fallback for errors without a code: what the API answers today. A 401 when no credentials
 * are saved, a 400 or 502 passing on Mux's 401 when they're rejected.
 */
const CREDENTIALS_ERROR_MESSAGES: Record<CredentialsProblem, RegExp> = {
  missing: /No MUX secrets found/,
  invalid: /api\.mux\.com responded with 401\b/,
}

const CREDENTIALS_ERRORS: Record<CredentialsProblem, string> = {
  missing: "Mux isn't set up for this dataset. Add your Mux credentials in the plugin settings.",
  invalid: 'Mux rejected the saved credentials. Check them in the plugin settings.',
}

const CREDENTIALS_PROBLEMS = Object.keys(CREDENTIALS_ERROR_CODES) as CredentialsProblem[]

function credentialsProblem(error: unknown): CredentialsProblem | undefined {
  const code = (error as {response?: {body?: {code?: unknown}}} | null)?.response?.body?.code
  const byCode = CREDENTIALS_PROBLEMS.find((problem) => CREDENTIALS_ERROR_CODES[problem] === code)
  if (byCode) return byCode

  const message = error instanceof Error ? error.message : ''
  return CREDENTIALS_PROBLEMS.find((problem) => CREDENTIALS_ERROR_MESSAGES[problem].test(message))
}

/** Turns credential failures into an error that says whether they're missing or rejected. */
export function toUploadError(error: unknown): unknown {
  const problem = credentialsProblem(error)
  return problem ? new Error(CREDENTIALS_ERRORS[problem]) : error
}

/**
 * Whether a poll error is worth retrying: `not-found` (a 404, the upload isn't available
 * yet) or `unavailable` (a 5xx or a network error with no status code).
 */
export function retryablePollError(error: unknown): 'not-found' | 'unavailable' | undefined {
  const statusCode = (error as {statusCode?: unknown} | null)?.statusCode
  if (typeof statusCode !== 'number' || statusCode >= 500) return 'unavailable'
  if (statusCode === 404) return 'not-found'
  return undefined
}

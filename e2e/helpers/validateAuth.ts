const USERS_ME_URL = 'https://api.sanity.io/v2021-06-07/users/me'

/**
 * Preflight: verify the session token can call Sanity `/users/me`.
 * Catches missing, expired, or wrong-kind tokens (e.g. deploy-only tokens)
 * before Playwright starts the browser suite.
 */
export async function validateAuthToken(token: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(USERS_ME_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `[e2e] Auth preflight failed: could not reach Sanity API (${message}). Check network access.`,
      {cause: error},
    )
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      [
        `[e2e] Auth preflight failed: token is missing, expired, or lacks access (HTTP ${response.status}).`,
        'Use a studio session/API token (sanity debug --secrets, or manage.sanity.io).',
        'Do not use SANITY_DEPLOY_TOKEN — that is for CLI deploy only.',
        'See e2e/README.md (Troubleshooting auth).',
      ].join('\n'),
    )
  }

  if (!response.ok) {
    throw new Error(
      `[e2e] Auth preflight failed: unexpected response from /users/me (HTTP ${response.status}).`,
    )
  }

  const body: unknown = await response.json()
  const id =
    body && typeof body === 'object' && 'id' in body ? (body as {id?: unknown}).id : undefined

  if (typeof id !== 'string' || id.length === 0) {
    throw new Error(
      '[e2e] Auth preflight failed: /users/me did not return a user id. Token may be invalid.',
    )
  }

  console.info(`[e2e] Auth preflight ok (user id present)`)
}

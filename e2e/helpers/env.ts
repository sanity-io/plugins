import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const PLACEHOLDER_VALUES = new Set([
  'changeme',
  'change-me',
  'your-token-here',
  'your_token_here',
  'todo',
  'xxx',
  'replace-me',
])

const E2E_ROOT = fileURLToPath(new URL('..', import.meta.url))

/**
 * Load `e2e/.env.local` then `e2e/.env` if present.
 * Does not override variables already set in the process environment.
 */
export function loadE2eEnvFiles(): void {
  for (const file of ['.env.local', '.env']) {
    const path = resolve(E2E_ROOT, file)
    if (!existsSync(path)) continue

    // Node's loadEnvFile does not override existing process.env keys.
    process.loadEnvFile(path)
  }
}

function isInvalidSecret(value: string | undefined): boolean {
  if (value === undefined) return true
  const trimmed = value.trim()
  if (trimmed.length === 0) return true
  return PLACEHOLDER_VALUES.has(trimmed.toLowerCase())
}

export function readBoolEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]
  if (value === undefined) return defaultValue
  return value === 'true' || value === '1' || value === 'yes'
}

export type E2eEnv = {
  token: string
  tokenSource: 'SANITY_E2E_SESSION_TOKEN' | 'STUDIO_AUTH_TOKEN'
  projectId: string
  baseUrl: string
  dataset: string
  ci: boolean
  headless: boolean
}

/**
 * Resolve and validate required e2e environment variables.
 * Throws with an actionable message listing every problem.
 */
export function resolveE2eEnv(): E2eEnv {
  const errors: string[] = []

  const sessionToken = process.env.SANITY_E2E_SESSION_TOKEN
  const studioToken = process.env.STUDIO_AUTH_TOKEN

  let token: string | undefined
  let tokenSource: E2eEnv['tokenSource'] | undefined

  if (!isInvalidSecret(sessionToken)) {
    token = sessionToken!.trim()
    tokenSource = 'SANITY_E2E_SESSION_TOKEN'
  } else if (!isInvalidSecret(studioToken)) {
    token = studioToken!.trim()
    tokenSource = 'STUDIO_AUTH_TOKEN'
  } else {
    errors.push(
      'SANITY_E2E_SESSION_TOKEN (or STUDIO_AUTH_TOKEN fallback) — required studio session/API token (not SANITY_DEPLOY_TOKEN)',
    )
  }

  const projectIdRaw = process.env.SANITY_E2E_PROJECT_ID ?? 'ppsg7ml5'
  const projectId = projectIdRaw.trim()
  if (isInvalidSecret(projectId) || projectId.length === 0) {
    errors.push('SANITY_E2E_PROJECT_ID — must be a non-empty project id')
  }

  const baseUrlRaw = process.env.SANITY_E2E_BASE_URL ?? 'http://localhost:3333'
  const baseUrl = baseUrlRaw.replace(/\/$/, '')
  try {
    void new URL(baseUrl)
  } catch {
    errors.push(`SANITY_E2E_BASE_URL — invalid URL: ${baseUrlRaw}`)
  }

  const dataset = (process.env.SANITY_STUDIO_DATASET ?? 'plugins').trim()
  if (dataset.length === 0) {
    errors.push('SANITY_STUDIO_DATASET — must be a non-empty dataset name')
  }

  if (errors.length > 0 || !token || !tokenSource) {
    throw new Error(
      [
        'Missing or invalid e2e env:',
        ...errors.map((line) => `  - ${line}`),
        'See e2e/.env.example and e2e/README.md (Required secrets / Troubleshooting auth).',
      ].join('\n'),
    )
  }

  // Log which token source won without printing the secret.
  console.info(`[e2e] Using auth token from ${tokenSource}`)

  return {
    token,
    tokenSource,
    projectId,
    baseUrl,
    dataset,
    ci: readBoolEnv('CI', false),
    headless: readBoolEnv('HEADLESS', true),
  }
}

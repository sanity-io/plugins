import {loadE2eEnvFiles, resolveE2eEnv} from './helpers/env.js'
import {validateAuthToken} from './helpers/validateAuth.js'

/**
 * Global setup for e2e tests: validate env + auth token against Sanity
 * `/users/me` so missing or wrong-kind tokens fail fast with a clear error.
 */
export default async function globalSetup(): Promise<void> {
  loadE2eEnvFiles()
  const env = resolveE2eEnv()
  await validateAuthToken(env.token)
}

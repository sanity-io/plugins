import {chromium, type FullConfig} from '@playwright/test'

import {loadE2eEnvFiles, resolveE2eEnv} from './helpers/env.js'
import {validateAuthToken} from './helpers/validateAuth.js'

const INIT_TIMEOUT_MS = 120_000

/**
 * Global setup for e2e tests:
 * 1. Validate env + auth token against Sanity `/users/me`
 * 2. Warm the studio until an authenticated `/users/me` browser request succeeds
 *    so cold Vite/preview compiles are not paid inside every test.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  loadE2eEnvFiles()
  const env = resolveE2eEnv()
  await validateAuthToken(env.token)

  const {baseURL, contextOptions, storageState} = config.projects[0]?.use ?? {}
  if (!baseURL) {
    throw new Error('[e2e] globalSetup: missing baseURL on Playwright project')
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({
    ...contextOptions,
    storageState,
  })
  const page = await context.newPage()

  try {
    await Promise.all([
      page.waitForResponse('*/**/users/me*', {timeout: INIT_TIMEOUT_MS}),
      page.goto(baseURL, {timeout: INIT_TIMEOUT_MS}),
    ])
  } finally {
    await browser.close()
  }
}

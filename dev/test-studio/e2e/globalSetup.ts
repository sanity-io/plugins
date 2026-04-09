import {chromium, type FullConfig} from '@playwright/test'

const INIT_TIMEOUT_MS = 120_000

/**
 * Global setup for smoke tests.
 *
 * Because the development server can be ready to receive requests but has not
 * precompiled javascript, we wait here until the initial bundle is ready.
 * This prevents each test from having to deal with the very different timeouts
 * for the first and subsequent requests.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const {baseURL = 'http://localhost:3333', contextOptions} = config.projects[0].use
  const browser = await chromium.launch()
  const context = await browser.newContext(contextOptions)
  const page = await context.newPage()

  await Promise.all([
    page.waitForResponse('*/**/users/me*', {timeout: INIT_TIMEOUT_MS}),
    page.goto(baseURL, {timeout: INIT_TIMEOUT_MS}),
  ])

  await browser.close()
}

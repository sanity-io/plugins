import {defineConfig, devices} from '@playwright/test'

const CI = process.env.CI === 'true'
const BASE_URL = process.env.SANITY_E2E_BASE_URL || 'http://localhost:3333'
const PROJECT_ID = process.env.SANITY_E2E_PROJECT_ID || 'ppsg7ml5'
const TOKEN = process.env.SANITY_E2E_SESSION_TOKEN || ''

export default defineConfig({
  globalSetup: './globalSetup',
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: {timeout: 30_000},
  fullyParallel: true,
  retries: CI ? 2 : 0,
  reporter: CI ? [['list'], ['blob']] : [['list'], ['html', {open: 'never'}]],
  outputDir: './results',

  use: {
    baseURL: BASE_URL,
    actionTimeout: 10_000,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    viewport: {width: 1728, height: 1000},
    headless: true,
    contextOptions: {reducedMotion: 'reduce'},
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE_URL,
          localStorage: [
            {
              name: `__studio_auth_token_${PROJECT_ID}`,
              value: JSON.stringify({
                token: TOKEN,
                time: new Date().toISOString(),
              }),
            },
          ],
        },
      ],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
  ],

  webServer: {
    command: CI ? 'pnpm sanity start' : 'pnpm sanity dev',
    // The config lives in e2e/ but sanity CLI must run from the studio root (dev/test-studio/)
    cwd: '..',
    port: 3333,
    reuseExistingServer: !CI,
    stdout: 'pipe',
    timeout: 120_000,
    env: {
      SANITY_INTERNAL_ENV: process.env.SANITY_INTERNAL_ENV || 'staging',
    },
  },
})

import {
  defineConfig,
  devices,
  type PlaywrightTestConfig,
  type PlaywrightTestProject,
} from '@playwright/test'

import {loadE2eEnvFiles, readBoolEnv, resolveE2eEnv} from './helpers/env.js'

loadE2eEnvFiles()
const env = resolveE2eEnv()

const CI = env.ci
const HEADLESS = env.headless
const BASE_URL = env.baseUrl
const PROJECT_ID = env.projectId
const TOKEN = env.token
const DEBUG = readBoolEnv('SANITY_E2E_DEBUG', false)

const TESTS_PATH = './tests'
const ARTIFACT_OUTPUT_PATH = './results'

/** Deployed hosts do not need a local webServer (follow-up: Vercel preview). */
function isRemoteStudioUrl(url: string): boolean {
  return url.includes('.sanity.studio') || url.includes('.sanity.dev') || url.includes('vercel.app')
}

const CHROMIUM_PROJECT: PlaywrightTestProject = {
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: {
      args: ['--disable-gpu', '--disable-software-rasterizer'],
    },
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },
}

const FIREFOX_PROJECT: PlaywrightTestProject = {
  name: 'firefox',
  use: {
    ...devices['Desktop Firefox'],
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },
}

const playwrightConfig: PlaywrightTestConfig = {
  globalSetup: './globalSetup',
  testDir: TESTS_PATH,
  timeout: 60_000,
  fullyParallel: true,
  expect: {
    timeout: 30_000,
  },
  outputDir: ARTIFACT_OUTPUT_PATH,
  retries: CI ? 2 : 0,
  reporter: [['list'], ['html', {open: 'never', outputFolder: 'playwright-report'}]],
  use: {
    actionTimeout: 10_000,
    trace: 'on-first-retry',
    viewport: {width: 1728, height: 1000},
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
    video: 'retain-on-failure',
    // Home kitchen-sink workspace
    baseURL: `${BASE_URL}/home`,
    headless: HEADLESS,
    contextOptions: {reducedMotion: 'reduce'},
  },
  projects: DEBUG ? [CHROMIUM_PROJECT] : [CHROMIUM_PROJECT, FIREFOX_PROJECT],
  webServer: isRemoteStudioUrl(BASE_URL)
    ? undefined
    : {
        command: CI ? 'pnpm start' : 'pnpm dev',
        url: `${BASE_URL}/home`,
        reuseExistingServer: !CI,
        timeout: 300_000,
        stdout: 'pipe',
        stderr: 'pipe',
        // Keep the studio under test on the same project/dataset as e2e auth.
        env: {
          ...process.env,
          SANITY_STUDIO_PROJECT_ID: PROJECT_ID,
          SANITY_STUDIO_DATASET: env.dataset,
        },
      },
}

export default defineConfig(playwrightConfig)

import {
  defineConfig,
  devices,
  type PlaywrightTestConfig,
  type PlaywrightTestProject,
} from '@playwright/test'

import {loadE2eEnvFiles, resolveE2eEnv} from './helpers/env.js'

loadE2eEnvFiles()
const env = resolveE2eEnv()

const CI = env.ci
const HEADLESS = env.headless
const BASE_URL = env.baseUrl
const PROJECT_ID = env.projectId
const TOKEN = env.token
/** CI matrix sets this so webServer health-checks the matching workspace. */
const E2E_BROWSER = process.env.SANITY_E2E_BROWSER === 'firefox' ? 'firefox' : 'chromium'

const TESTS_PATH = './tests'
const ARTIFACT_OUTPUT_PATH = './results'

/** Deployed hosts do not need a local webServer (follow-up: Vercel studio preview). */
function isRemoteStudioUrl(url: string): boolean {
  return url.includes('.sanity.studio') || url.includes('.sanity.dev') || url.includes('vercel.app')
}

const studioWebServerEnv = {
  ...process.env,
  SANITY_STUDIO_PROJECT_ID: PROJECT_ID,
  SANITY_E2E_PROJECT_ID: PROJECT_ID,
  SANITY_E2E_DATASET: env.dataset,
  SANITY_E2E_DATASET_CHROMIUM: env.datasetChromium,
  SANITY_E2E_DATASET_FIREFOX: env.datasetFirefox,
}

const CHROMIUM_PROJECT: PlaywrightTestProject = {
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `${BASE_URL}/chromium`,
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
    baseURL: `${BASE_URL}/firefox`,
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
  reporter: CI
    ? [
        ['list'],
        // Blob shards are merged in CI (`report` job) into HTML + summary.
        ['blob'],
      ]
    : [['list'], ['html', {open: 'never', outputFolder: 'playwright-report'}]],
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
    baseURL: BASE_URL,
    headless: HEADLESS,
    contextOptions: {reducedMotion: 'reduce'},
  },
  projects: [CHROMIUM_PROJECT, FIREFOX_PROJECT],
  webServer: isRemoteStudioUrl(BASE_URL)
    ? undefined
    : {
        command: CI ? 'pnpm start' : 'pnpm dev',
        url: `${BASE_URL}/${E2E_BROWSER}`,
        reuseExistingServer: !CI,
        timeout: 300_000,
        stdout: 'pipe',
        stderr: 'pipe',
        env: studioWebServerEnv,
      },
}

export default defineConfig(playwrightConfig)

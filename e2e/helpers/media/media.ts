import {randomUUID} from 'node:crypto'

import {expect, type Page} from '@playwright/test'

import {createE2EClient} from '../e2eClient.js'
import {loadE2eEnvFiles, resolveE2eEnv} from '../env.js'

loadE2eEnvFiles()

/** 1×1 PNG */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

export type SeededMediaAsset = {
  id: string
  filename: string
}

function datasetForProject(projectName: string | undefined): string {
  const env = resolveE2eEnv()
  if (projectName === 'firefox') return env.datasetFirefox
  return env.datasetChromium
}

/** Upload a tiny image asset for Media tool e2e coverage. */
export async function seedMediaImage(projectName: string | undefined): Promise<SeededMediaAsset> {
  const client = createE2EClient(datasetForProject(projectName))
  const filename = `e2e-media-${randomUUID()}.png`

  const asset = await client.assets.upload('image', TINY_PNG, {
    filename,
    contentType: 'image/png',
  })

  return {id: asset._id, filename}
}

export async function deleteMediaAsset(
  projectName: string | undefined,
  assetId: string,
): Promise<void> {
  const client = createE2EClient(datasetForProject(projectName))
  await client.delete(assetId).catch(() => undefined)
}

export async function getMediaAssetTitle(
  projectName: string | undefined,
  assetId: string,
): Promise<string | undefined> {
  const client = createE2EClient(datasetForProject(projectName))
  const doc = await client.getDocument<{title?: string}>(assetId)
  return doc?.title
}

/** Open the Media tool (relative to workspace baseURL). */
export async function openMediaTool(page: Page): Promise<void> {
  await page.goto('media')
  await expect(page.getByTestId('studio-navbar')).toBeVisible()
  await expect(page.getByTestId('media-browser')).toBeVisible()
  await expect(page.getByText('Browse Assets')).toBeVisible()
}

/** Filter the asset grid so a freshly seeded upload is easy to find. */
export async function searchMediaAssets(page: Page, query: string): Promise<void> {
  const search = page.getByPlaceholder('Search')
  await search.fill(query)
}

export function mediaAssetCard(page: Page, assetId: string) {
  return page.getByTestId(`media-asset-card-${assetId}`)
}

export function assetDetailsDialog(page: Page) {
  return page.getByRole('dialog', {name: /asset details/i})
}

import {randomUUID} from 'node:crypto'

import {expect, type Page} from '@playwright/test'

import {createE2EClient} from '../e2eClient.js'
import {loadE2eEnvFiles, resolveE2eEnv} from '../env.js'

loadE2eEnvFiles()

const DOC_TYPE = 'mediaProduct'
const TAG_TYPE = 'media.tag'
const FOLDER_TYPE = 'media.folder'

/** 1×1 PNG */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

export type SeededMediaAsset = {
  id: string
  filename: string
}

export type SeededMediaProduct = {
  id: string
}

function datasetForProject(projectName: string | undefined): string {
  const env = resolveE2eEnv()
  if (projectName === 'firefox') return env.datasetFirefox
  return env.datasetChromium
}

/** Upload a tiny image asset for Media tool e2e coverage. */
export async function seedMediaImage(
  projectName: string | undefined,
  opts: {title?: string; folderId?: string; tagIds?: string[]} = {},
): Promise<SeededMediaAsset> {
  const client = createE2EClient(datasetForProject(projectName))
  const filename = `e2e-media-${randomUUID()}.png`

  const asset = await client.assets.upload('image', TINY_PNG, {
    filename,
    contentType: 'image/png',
  })

  const patch: Record<string, unknown> = {}
  if (opts.title) patch.title = opts.title
  if (opts.folderId || opts.tagIds?.length) {
    patch.opt = {
      media: {
        ...(opts.folderId ? {folder: {_type: 'reference', _ref: opts.folderId, _weak: true}} : {}),
        ...(opts.tagIds?.length
          ? {
              tags: opts.tagIds.map((tagId) => ({
                _key: randomUUID(),
                _type: 'reference',
                _ref: tagId,
                _weak: true,
              })),
            }
          : {}),
      },
    }
  }

  if (Object.keys(patch).length > 0) {
    await client.patch(asset._id).set(patch).commit()
  }

  return {id: asset._id, filename}
}

export async function seedMediaTag(projectName: string | undefined, name: string): Promise<string> {
  const client = createE2EClient(datasetForProject(projectName))
  const id = `${TAG_TYPE}.${randomUUID()}`
  await client.createOrReplace({
    _id: id,
    _type: TAG_TYPE,
    name: {_type: 'slug', current: name},
  })
  return id
}

export async function seedMediaFolder(
  projectName: string | undefined,
  name: string,
): Promise<string> {
  const client = createE2EClient(datasetForProject(projectName))
  const id = `${FOLDER_TYPE}.${randomUUID()}`
  await client.createOrReplace({
    _id: id,
    _type: FOLDER_TYPE,
    name,
  })
  return id
}

export async function seedMediaProduct(
  projectName: string | undefined,
  opts: {name?: string; imageAssetId?: string} = {},
): Promise<SeededMediaProduct> {
  const client = createE2EClient(datasetForProject(projectName))
  const id = randomUUID()
  await client.createOrReplace({
    _id: `drafts.${id}`,
    _type: DOC_TYPE,
    name: opts.name ?? `Product ${id.slice(0, 8)}`,
    ...(opts.imageAssetId
      ? {
          image: {
            _type: 'image',
            asset: {_type: 'reference', _ref: opts.imageAssetId},
          },
        }
      : {}),
  })
  return {id}
}

export async function deleteMediaAsset(
  projectName: string | undefined,
  assetId: string,
): Promise<void> {
  const client = createE2EClient(datasetForProject(projectName))
  await client.delete(assetId).catch(() => undefined)
}

export async function deleteMediaDocuments(
  projectName: string | undefined,
  ids: string[],
): Promise<void> {
  const client = createE2EClient(datasetForProject(projectName))
  const tx = client.transaction()
  for (const id of ids) {
    tx.delete(id)
    tx.delete(`drafts.${id}`)
  }
  await tx.commit({visibility: 'async'}).catch(() => undefined)
}

export async function getMediaAssetTitle(
  projectName: string | undefined,
  assetId: string,
): Promise<string | undefined> {
  const client = createE2EClient(datasetForProject(projectName))
  const doc = await client.getDocument<{title?: string}>(assetId)
  return doc?.title
}

export async function getMediaAssetTags(
  projectName: string | undefined,
  assetId: string,
): Promise<string[]> {
  const client = createE2EClient(datasetForProject(projectName))
  const doc = await client.fetch<string[] | null>(`*[_id == $id][0].opt.media.tags[]._ref`, {
    id: assetId,
  })
  return doc ?? []
}

export async function getMediaAssetFolder(
  projectName: string | undefined,
  assetId: string,
): Promise<string | undefined> {
  const client = createE2EClient(datasetForProject(projectName))
  const doc = await client.fetch<string | null>(`*[_id == $id][0].opt.media.folder._ref`, {
    id: assetId,
  })
  return doc ?? undefined
}

export async function getDocumentImageAssetId(
  projectName: string | undefined,
  documentId: string,
): Promise<string | undefined> {
  const client = createE2EClient(datasetForProject(projectName))
  const ref = await client.fetch<string | null>(`*[_id in [$id, $draft]][0].image.asset._ref`, {
    id: documentId,
    draft: `drafts.${documentId}`,
  })
  return ref ?? undefined
}

/** Open the Media tool (relative to workspace baseURL). */
export async function openMediaTool(page: Page): Promise<void> {
  await page.goto('media')
  await expect(page.getByTestId('studio-navbar')).toBeVisible()
  await expect(page.getByTestId('media-browser')).toBeVisible()
  await expect(page.getByText('Browse Assets')).toBeVisible()
}

export async function openMediaProduct(page: Page, documentId: string): Promise<void> {
  await page.goto(`intent/edit/id=${documentId};type=${DOC_TYPE}`)
  await expect(page.getByTestId('studio-navbar')).toBeVisible()
  await expect(page.getByTestId('document-pane').first()).toBeVisible()
  await expect(page.getByTestId('form-view').first()).toBeVisible()
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

/** Open the Media asset source from an empty image field. */
export async function openMediaAssetSource(page: Page, fieldName = 'image'): Promise<void> {
  const field = page.getByTestId(`field-${fieldName}`)
  await expect(field).toBeVisible()

  const mediaBrowse = field.getByTestId('file-input-browse-button-media')
  if (await mediaBrowse.count()) {
    await mediaBrowse.click()
  } else {
    const multi = field.getByTestId('file-input-multi-browse-button')
    if (await multi.count()) {
      await multi.click()
      await page.getByRole('menuitem', {name: /^Media$/i}).click()
    } else {
      await field
        .getByRole('button', {name: /^Select$/i})
        .first()
        .click()
      const mediaItem = page.getByRole('menuitem', {name: /^Media$/i})
      if (await mediaItem.count()) {
        await mediaItem.click()
      }
    }
  }

  await expect(page.getByTestId('media-browser')).toBeVisible({timeout: 30_000})
  await expect(page.getByText(/Insert image/i)).toBeVisible()
}

/** Open Edit Media for an already-selected image. */
export async function openEditMediaSource(page: Page, fieldName = 'image'): Promise<void> {
  const field = page.getByTestId(`field-${fieldName}`)
  const editBrowse = field.getByTestId('file-input-browse-button-edit-media')
  if (await editBrowse.count()) {
    await editBrowse.click()
  } else {
    const menuButton = field.locator('[data-testid="options-menu-button"], button').last()
    await menuButton.click()
    await page.getByRole('menuitem', {name: /Edit Media/i}).click()
  }

  await expect(assetDetailsDialog(page)).toBeVisible({timeout: 30_000})
}

export async function uploadTinyPngViaMediaTool(page: Page): Promise<string> {
  const filename = `e2e-upload-${randomUUID()}.png`

  await page.getByRole('button', {name: /Upload image|Upload assets/i}).click()
  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.setInputFiles({
    name: filename,
    mimeType: 'image/png',
    buffer: TINY_PNG,
  })

  return filename
}

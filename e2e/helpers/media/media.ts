import {randomUUID} from 'node:crypto'
import {deflateSync} from 'node:zlib'

import {expect, type Locator, type Page} from '@playwright/test'

import {createE2EClient} from '../e2eClient.js'
import {loadE2eEnvFiles, resolveE2eEnv} from '../env.js'

loadE2eEnvFiles()

const DOC_TYPE = 'mediaProduct'
const TAG_TYPE = 'media.tag'
const FOLDER_TYPE = 'media.folder'

/**
 * Sanity asset ids are content-addressed. Parallel e2e tests that upload the same
 * bytes share one asset and race on delete/search — always generate unique PNG bytes.
 */
function crc32(buf: Buffer): number {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]!
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
  }
  return ~c >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

/** Valid unique 1×1 RGB PNG (content hash differs per `unique` string). */
export function uniqueTinyPng(unique = randomUUID()): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(1, 0)
  ihdrData.writeUInt32BE(1, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 2 // RGB
  const ihdr = pngChunk('IHDR', ihdrData)

  const r = unique.charCodeAt(0) % 256
  const g = unique.charCodeAt(1) % 256
  const b = unique.charCodeAt(2) % 256
  const idat = pngChunk('IDAT', deflateSync(Buffer.from([0, r, g, b])))
  const text = pngChunk(
    'tEXt',
    Buffer.concat([Buffer.from('UUID'), Buffer.from([0]), Buffer.from(unique)]),
  )
  const iend = pngChunk('IEND', Buffer.alloc(0))
  return Buffer.concat([signature, ihdr, idat, text, iend])
}

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

function mediaBrowser(page: Page): Locator {
  return page.getByTestId('media-browser')
}

/** Image / file fieldset in the document form (Sanity FormFieldSet → role=group). */
function mediaProductField(page: Page, title: 'Image' | 'Attachment'): Locator {
  return page
    .getByRole('group')
    .filter({has: page.getByText(title, {exact: true})})
    .first()
}

/** Upload a tiny image asset for Media tool e2e coverage. */
export async function seedMediaImage(
  projectName: string | undefined,
  opts: {title?: string; folderId?: string; tagIds?: string[]} = {},
): Promise<SeededMediaAsset> {
  const client = createE2EClient(datasetForProject(projectName))
  const filename = `e2e-media-${randomUUID()}.png`
  const bytes = uniqueTinyPng(filename)

  const asset = await client.assets.upload('image', bytes, {
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
  await expect(mediaBrowser(page)).toBeVisible()
  await expect(page.getByText('Browse Assets')).toBeVisible()
  const dismiss = page.getByRole('button', {name: 'Dismiss announcements'})
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click()
  }
}

export async function openMediaProduct(page: Page, documentId: string): Promise<void> {
  await page.goto(`intent/edit/id=${documentId};type=${DOC_TYPE}`)
  await expect(page.getByTestId('studio-navbar')).toBeVisible()
  await expect(page.getByTestId('document-pane').first()).toBeVisible()
  await expect(page.getByTestId('form-view').first()).toBeVisible()
  // Prefer the Image fieldset over fragile field-${name} testids on object inputs.
  await expect(mediaProductField(page, 'Image')).toBeVisible({timeout: 30_000})
}

/** Filter the asset grid so a freshly seeded upload is easy to find. */
export async function searchMediaAssets(page: Page, query: string): Promise<void> {
  const search = mediaBrowser(page).getByPlaceholder('Search')
  await search.fill(query)
}

export function mediaAssetCard(page: Page, assetId: string) {
  return mediaBrowser(page).getByTestId(`media-asset-card-${assetId}`)
}

export function assetDetailsDialog(page: Page) {
  return page.getByRole('dialog', {name: /asset details/i})
}

function assetInputTestIdPrefix(fieldTitle: 'Image' | 'Attachment'): string {
  return fieldTitle === 'Attachment' ? 'file-object-input' : 'image-object-input'
}

/** Open the Media asset source from an empty image/file field. */
export async function openMediaAssetSource(
  page: Page,
  fieldTitle: 'Image' | 'Attachment' = 'Image',
): Promise<void> {
  const field = mediaProductField(page, fieldTitle)
  await expect(field).toBeVisible()

  const prefix = assetInputTestIdPrefix(fieldTitle)
  // Prefer Sanity's asset-source browse testids; fall back to the Select menu.
  const mediaBrowse = page.getByTestId(`${prefix}-browse-button-media`)
  const multiBrowse = page.getByTestId(`${prefix}-multi-browse-button`)
  if (await multiBrowse.isVisible().catch(() => false)) {
    await multiBrowse.click()
    await page.getByRole('menuitem', {name: /^Media$/i}).click()
  } else if (await mediaBrowse.isVisible().catch(() => false)) {
    await mediaBrowse.click()
  } else {
    await field.getByRole('button', {name: /^Select$/i}).click()
    await page.getByRole('menuitem', {name: /^Media$/i}).click()
  }

  await expect(mediaBrowser(page)).toBeVisible({timeout: 30_000})
  await expect(page.getByText(/Insert (image|file)/i)).toBeVisible()
}

/**
 * mediaField options.mediaTags pre-filters the asset source. Clear that facet so
 * freshly seeded (untagged) assets remain selectable in auto-tag tests.
 */
export async function clearMediaSearchFacets(page: Page): Promise<void> {
  const clear = mediaBrowser(page).getByRole('button', {name: 'Clear', exact: true})
  // Facets are applied after the tags fetch completes — wait for Clear when present.
  try {
    await clear.waitFor({state: 'visible', timeout: 10_000})
    await clear.click()
  } catch {
    // No active facets — nothing to clear.
  }
}

/** Open Edit Media for an already-selected image. */
export async function openEditMediaSource(
  page: Page,
  fieldTitle: 'Image' | 'Attachment' = 'Image',
): Promise<void> {
  const field = mediaProductField(page, fieldTitle)
  await expect(field).toBeVisible()

  const prefix = assetInputTestIdPrefix(fieldTitle)
  const editBrowse = page.getByTestId(`${prefix}-browse-button-edit-media`)
  if (await editBrowse.isVisible().catch(() => false)) {
    await editBrowse.click()
  } else {
    await field.getByRole('button', {name: /Open image options menu/i}).click()
    await page.getByRole('menuitem', {name: /Edit Media/i}).click()
  }

  await expect(assetDetailsDialog(page)).toBeVisible({timeout: 30_000})
}

export async function openTagsPanel(page: Page): Promise<void> {
  const browser = mediaBrowser(page)
  const createTag = browser.getByRole('button', {name: 'Create tag', exact: true})
  if (await createTag.isVisible().catch(() => false)) return

  const toggle = browser.getByRole('button', {name: 'Toggle tags panel', exact: true})
  if (await toggle.count()) {
    await toggle.click()
  } else {
    // Narrow viewports open Tags via the Filters row button.
    await browser.getByRole('button', {name: /^Tags$/i}).click()
  }

  await expect(createTag).toBeVisible({timeout: 10_000})
}

export async function openFoldersPanel(page: Page): Promise<void> {
  const browser = mediaBrowser(page)
  await browser.getByRole('button', {name: 'Toggle folders panel', exact: true}).click()
}

export async function uploadTinyPngViaMediaTool(page: Page): Promise<string> {
  const filename = `e2e-upload-${randomUUID()}.png`
  const bytes = uniqueTinyPng(filename)

  // Use anchored names so we don't match a parent control whose accessible name
  // includes descendant "Upload assets" text (strict-mode duplicate).
  await mediaBrowser(page)
    .getByRole('button', {name: /^Upload (image|assets)$/i})
    .click()
  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.setInputFiles({
    name: filename,
    mimeType: 'image/png',
    buffer: bytes,
  })

  return filename
}

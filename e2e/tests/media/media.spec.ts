import {expect, test} from '@playwright/test'

import {
  assetDetailsDialog,
  deleteMediaAsset,
  deleteMediaDocuments,
  getDocumentImageAssetId,
  getMediaAssetTags,
  getMediaAssetTitle,
  mediaAssetCard,
  openEditMediaSource,
  openMediaAssetSource,
  openMediaProduct,
  openMediaTool,
  searchMediaAssets,
  seedMediaFolder,
  seedMediaImage,
  seedMediaProduct,
  seedMediaTag,
  uploadTinyPngViaMediaTool,
} from '../../helpers/media/media.js'

test.describe('sanity-plugin-media', () => {
  test('opens the Media tool and shows a seeded asset', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const asset = await seedMediaImage(projectName)

    try {
      await openMediaTool(page)
      await searchMediaAssets(page, asset.filename)
      await expect(mediaAssetCard(page, asset.id)).toBeVisible({timeout: 30_000})
    } finally {
      await deleteMediaAsset(projectName, asset.id)
    }
  })

  test('edits asset title from the Media library and saves', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const asset = await seedMediaImage(projectName)
    const nextTitle = `E2E title ${asset.id.slice(-8)}`

    try {
      await openMediaTool(page)
      await searchMediaAssets(page, asset.filename)

      const card = mediaAssetCard(page, asset.id)
      await expect(card).toBeVisible({timeout: 30_000})
      await card.click()

      const dialog = assetDetailsDialog(page)
      await expect(dialog).toBeVisible()

      const titleInput = dialog.locator('input[name="title"]')
      const saveButton = dialog.getByRole('button', {name: /save and close/i})

      await expect(saveButton).toBeDisabled()
      await titleInput.fill(nextTitle)
      await expect(saveButton).toBeEnabled()
      await saveButton.click()

      await expect(dialog).toBeHidden()

      await expect
        .poll(async () => getMediaAssetTitle(projectName, asset.id), {timeout: 30_000})
        .toBe(nextTitle)
    } finally {
      await deleteMediaAsset(projectName, asset.id)
    }
  })

  test('selects an image from the Media asset source into a document field', async ({
    page,
  }, testInfo) => {
    const projectName = testInfo.project.name
    const asset = await seedMediaImage(projectName)
    const doc = await seedMediaProduct(projectName)

    try {
      await openMediaProduct(page, doc.id)
      await openMediaAssetSource(page, 'image')
      await searchMediaAssets(page, asset.filename)

      const card = mediaAssetCard(page, asset.id)
      await expect(card).toBeVisible({timeout: 30_000})
      await card.click()

      await expect
        .poll(async () => getDocumentImageAssetId(projectName, doc.id), {timeout: 30_000})
        .toBe(asset.id)
    } finally {
      await deleteMediaDocuments(projectName, [doc.id])
      await deleteMediaAsset(projectName, asset.id)
    }
  })

  test('uploads an image through the Media tool', async ({page}) => {
    await openMediaTool(page)
    const uploadedFilename = await uploadTinyPngViaMediaTool(page)

    await searchMediaAssets(page, uploadedFilename)
    await expect(page.getByText(uploadedFilename).first()).toBeVisible({timeout: 60_000})
  })

  test('creates a tag from the Tags panel', async ({page}) => {
    const tagName = `e2e-tag-${Date.now().toString(36)}`

    await openMediaTool(page)

    const tagsToggle = page.getByRole('button', {name: /^Tags$/i})
    if (await tagsToggle.count()) {
      await tagsToggle.first().click()
    }

    await page.getByRole('button', {name: 'Create tag'}).click()
    const createDialog = page.getByRole('dialog', {name: /create tag/i})
    await expect(createDialog).toBeVisible()
    await createDialog.locator('input[name="name"]').fill(tagName)
    await createDialog.getByRole('button', {name: /save and close/i}).click()
    await expect(createDialog).toBeHidden({timeout: 30_000})
    await expect(page.getByText(tagName).first()).toBeVisible({timeout: 30_000})
  })

  test('filters assets by folder in the Media tool', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const folderName = `E2E Folder ${Date.now()}`
    const folderId = await seedMediaFolder(projectName, folderName)
    const asset = await seedMediaImage(projectName, {folderId})
    const cleanupIds = [asset.id, folderId]

    try {
      await openMediaTool(page)
      await page.getByRole('button', {name: 'Toggle folders panel'}).click()
      await expect(page.getByText(folderName).first()).toBeVisible({timeout: 30_000})
      await page.getByText(folderName).first().click()
      await expect(mediaAssetCard(page, asset.id)).toBeVisible({timeout: 30_000})
    } finally {
      await deleteMediaDocuments(projectName, cleanupIds)
    }
  })

  test('auto-tags an asset when selected via mediaField', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const tagId = await seedMediaTag(projectName, 'product')
    const asset = await seedMediaImage(projectName)
    const doc = await seedMediaProduct(projectName)
    const cleanupIds = [doc.id, asset.id, tagId]

    try {
      await openMediaProduct(page, doc.id)
      await openMediaAssetSource(page, 'image')
      await searchMediaAssets(page, asset.filename)

      const card = mediaAssetCard(page, asset.id)
      await expect(card).toBeVisible({timeout: 30_000})
      await card.click()

      await expect
        .poll(async () => getDocumentImageAssetId(projectName, doc.id), {timeout: 30_000})
        .toBe(asset.id)

      await expect
        .poll(async () => getMediaAssetTags(projectName, asset.id), {timeout: 30_000})
        .toContain(tagId)
    } finally {
      await deleteMediaDocuments(projectName, cleanupIds)
    }
  })

  test('edits asset metadata via Edit Media from a document field', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const asset = await seedMediaImage(projectName, {title: 'Before edit'})
    const doc = await seedMediaProduct(projectName, {imageAssetId: asset.id})
    const nextTitle = `Edited via form ${asset.id.slice(-6)}`
    const cleanupIds = [doc.id, asset.id]

    try {
      await openMediaProduct(page, doc.id)
      await openEditMediaSource(page, 'image')

      const dialog = assetDetailsDialog(page)
      const titleInput = dialog.locator('input[name="title"]')
      await titleInput.fill(nextTitle)
      await dialog.getByRole('button', {name: /save and close/i}).click()
      await expect(dialog).toBeHidden({timeout: 30_000})

      await expect
        .poll(async () => getMediaAssetTitle(projectName, asset.id), {timeout: 30_000})
        .toBe(nextTitle)
    } finally {
      await deleteMediaDocuments(projectName, cleanupIds)
    }
  })
})

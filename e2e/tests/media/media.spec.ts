import {expect, test} from '@playwright/test'

import {
  assetDetailsDialog,
  deleteMediaAsset,
  getMediaAssetTitle,
  mediaAssetCard,
  openMediaTool,
  searchMediaAssets,
  seedMediaImage,
} from '../../helpers/media/media.js'

test.describe('sanity-plugin-media', () => {
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
})

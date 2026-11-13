import {randomUUID} from 'node:crypto'

import {expect, test} from '@playwright/test'

import {createE2EClient} from '../../helpers/e2eClient.js'
import {loadE2eEnvFiles, resolveE2eEnv} from '../../helpers/env.js'
import {
  assetDetailsDialog,
  clearMediaSearchFacets,
  deleteMediaAsset,
  deleteMediaDocuments,
  getMediaAssetTitle,
  mediaAssetCard,
  openTagsPanel,
  searchMediaAssets,
  seedMediaImage,
} from '../../helpers/media/media.js'

loadE2eEnvFiles()

const PAGE_TYPE = 'mediaPage'

test('saves asset details and a new tag from a page-builder image field', async ({
  page,
}, testInfo) => {
  const projectName = testInfo.project.name
  const env = resolveE2eEnv()
  const dataset = projectName === 'firefox' ? env.datasetFirefox : env.datasetChromium
  const client = createE2EClient(dataset)

  const asset = await seedMediaImage(projectName)
  const pageId = randomUUID()
  const nextTitle = `Page builder title ${asset.id.slice(-8)}`
  const tagName = `e2e-pb-tag-${randomUUID()}`

  await client.createOrReplace({
    _id: `drafts.${pageId}`,
    _type: PAGE_TYPE,
    title: 'Page builder repro',
    pageBuilder: [{_key: 'block1', _type: 'mediaImageBlock'}],
  })

  try {
    await page.goto(`intent/edit/id=${pageId};type=${PAGE_TYPE}`)
    await expect(page.getByTestId('document-pane').first()).toBeVisible()
    await expect(page.getByRole('textbox', {name: 'Title'})).toHaveValue('Page builder repro', {
      timeout: 30_000,
    })

    const pageBuilder = page.getByRole('group').filter({
      has: page.getByText('Page builder', {exact: true}),
    })
    // Empty object items preview as "{empty}" until a field has a value.
    const item = pageBuilder.getByRole('button', {name: '{empty}'})
    await expect(item).toBeVisible({timeout: 30_000})
    await item.click()
    const itemDialog = page.getByTestId('nested-object-dialog')
    await expect(itemDialog).toBeVisible({timeout: 30_000})

    const imageField = itemDialog.getByRole('group').filter({
      has: page.getByText('Block image', {exact: true}),
    })
    await imageField.getByRole('button', {name: /^Select$/i}).click()
    await page.getByRole('menuitem', {name: /^Media$/i}).click()

    await expect(page.getByTestId('media-browser')).toBeVisible({timeout: 30_000})
    await clearMediaSearchFacets(page)
    await searchMediaAssets(page, asset.filename)

    const preview = mediaAssetCard(page, asset.id)
    await expect(preview).toBeVisible({timeout: 30_000})
    // The edit pen and filename sit in the footer, a sibling of the preview
    // node that carries the card test id. Clicking the preview selects the
    // asset instead of opening details.
    const footer = preview.locator('xpath=../following-sibling::*')
    await expect(footer).toBeVisible()
    await footer.click()

    const dialog = assetDetailsDialog(page)
    await expect(dialog).toBeVisible()

    const titleInput = dialog.locator('input[name="title"]')
    const saveButton = dialog.getByRole('button', {name: /save and close/i})
    await titleInput.fill(nextTitle)
    await expect(saveButton).toBeEnabled({timeout: 10_000})
    await saveButton.click()

    await expect(dialog).toBeHidden({timeout: 30_000})
    await expect
      .poll(async () => getMediaAssetTitle(projectName, asset.id), {timeout: 30_000})
      .toBe(nextTitle)

    // Creating a tag from this browser was reported to fail the same way: Save
    // and close receives mousedown, then the footer remounts and click never fires.
    await openTagsPanel(page)
    await page.getByRole('button', {name: 'Create tag', exact: true}).click()
    const tagDialog = page.getByRole('dialog', {name: /create tag/i})
    await expect(tagDialog).toBeVisible()
    const tagSave = tagDialog.getByRole('button', {name: /save and close/i})
    await tagDialog.locator('input[name="name"]').fill(tagName)
    await expect(tagSave).toBeEnabled({timeout: 10_000})
    await tagSave.click()
    await expect(tagDialog).toBeHidden({timeout: 30_000})
    await expect(page.getByText(tagName).first()).toBeVisible({timeout: 30_000})
  } finally {
    const tagId = await client.fetch<string | null>(
      `*[_type == "media.tag" && name.current == $name][0]._id`,
      {name: tagName},
    )
    if (tagId) await client.delete(tagId)
    await deleteMediaDocuments(projectName, [pageId])
    await deleteMediaAsset(projectName, asset.id)
  }
})

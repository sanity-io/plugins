import {expect, test} from '@playwright/test'

import {
  deleteI18nPost,
  deleteI18nPostInStudio,
  documentAddButton,
  fieldAddButton,
  getI18nPost,
  languageItem,
  languageLabel,
  openI18nPost,
  openLanguageFilter,
  seedI18nPost,
} from '../../helpers/internationalized-array/internationalizedArray.js'

test.describe('sanity-plugin-internationalized-array', () => {
  /**
   * `defaultLanguages` only auto-seeds after the document exists in the
   * pair store. Opening a persisted empty array must create the EN item.
   */
  test('seeds default language on an existing empty document', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const doc = await seedI18nPost(projectName, {title: [], summary: []})

    try {
      await openI18nPost(page, doc.id)

      await expect(languageLabel(page, 'en')).toBeVisible()
      // EN is present → its field add button is disabled
      await expect(fieldAddButton(page, 'en')).toHaveAttribute('data-disabled', 'true')
    } finally {
      await deleteI18nPost(projectName, doc.id)
    }
  })

  test('does not recreate a document after deleting it from the studio', async ({
    page,
  }, testInfo) => {
    const projectName = testInfo.project.name
    const doc = await seedI18nPost(projectName, {title: [], summary: []})

    try {
      await openI18nPost(page, doc.id)
      await expect(languageLabel(page, 'en')).toBeVisible()

      await deleteI18nPostInStudio(page)

      await expect.poll(async () => getI18nPost(projectName, doc.id), {timeout: 20_000}).toBeNull()

      // Auto-add uses a setTimeout; wait long enough that a resurrecting patch
      // would have landed, then confirm the document is still gone.
      await new Promise((resolve) => setTimeout(resolve, 2_000))
      expect(await getI18nPost(projectName, doc.id)).toBeNull()
    } finally {
      await deleteI18nPost(projectName, doc.id)
    }
  })

  test('adds Spanish from field add buttons', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const doc = await seedI18nPost(projectName, {
      title: [languageItem('en', 'Hello')],
    })

    try {
      await openI18nPost(page, doc.id)
      await expect(languageLabel(page, 'en')).toBeVisible()

      await fieldAddButton(page, 'es').click()
      await expect(languageLabel(page, 'es')).toBeVisible()
      await expect(fieldAddButton(page, 'es')).toHaveAttribute('data-disabled', 'true')
    } finally {
      await deleteI18nPost(projectName, doc.id)
    }
  })

  test('adds all missing languages from the field', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const doc = await seedI18nPost(projectName, {
      title: [languageItem('en', 'Hello')],
    })

    try {
      await openI18nPost(page, doc.id)

      await page.getByTestId('field-title').getByTestId('add-all-languages').click()

      await expect(languageLabel(page, 'en')).toBeVisible()
      await expect(languageLabel(page, 'es')).toBeVisible()
      await expect(languageLabel(page, 'fr')).toBeVisible()
      // All languages present → add-all control is gone or disabled
      await expect(page.getByTestId('field-title').getByTestId('add-all-languages')).toHaveCount(0)
    } finally {
      await deleteI18nPost(projectName, doc.id)
    }
  })

  test('removes a non-default language and keeps default remove disabled', async ({
    page,
  }, testInfo) => {
    const projectName = testInfo.project.name
    const doc = await seedI18nPost(projectName, {
      title: [languageItem('en', 'Hello'), languageItem('es', 'Hola')],
    })

    try {
      await openI18nPost(page, doc.id)
      await expect(languageLabel(page, 'es')).toBeVisible()

      const titleField = page.getByTestId('field-title')
      const removeButtons = titleField.locator('[data-sanity-icon="remove-circle"]')
      // EN (default) then ES
      await expect(removeButtons).toHaveCount(2)
      await expect(removeButtons.nth(0).locator('xpath=ancestor::button[1]')).toHaveAttribute(
        'data-disabled',
        'true',
      )

      await removeButtons.nth(1).locator('xpath=ancestor::button[1]').click()
      await expect(languageLabel(page, 'es')).toHaveCount(0)
      await expect(languageLabel(page, 'en')).toBeVisible()
    } finally {
      await deleteI18nPost(projectName, doc.id)
    }
  })

  test('document-level add buttons insert a missing language across root fields', async ({
    page,
  }, testInfo) => {
    const projectName = testInfo.project.name
    const doc = await seedI18nPost(projectName, {
      title: [languageItem('en', 'Title EN')],
      summary: [languageItem('en', 'Summary EN')],
    })

    try {
      await openI18nPost(page, doc.id)

      await expect(page.getByTestId('document-add-buttons')).toBeVisible()
      await documentAddButton(page, 'es').click()

      // Spanish appears in both root internationalized string fields
      await expect(languageLabel(page, 'es', 'title')).toBeVisible()
      await expect(languageLabel(page, 'es', 'summary')).toBeVisible()
    } finally {
      await deleteI18nPost(projectName, doc.id)
    }
  })

  test('language filter hides non-selected array items', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const doc = await seedI18nPost(projectName, {
      title: [
        languageItem('en', 'Hello'),
        languageItem('es', 'Hola'),
        languageItem('fr', 'Bonjour'),
      ],
    })

    try {
      await openI18nPost(page, doc.id)
      await expect(languageLabel(page, 'es')).toBeVisible()
      await expect(languageLabel(page, 'fr')).toBeVisible()

      await openLanguageFilter(page)
      // Toggle off Spanish and French (English is a default language — always shown)
      await page.getByRole('button', {name: /Spanish/}).click()
      await page.getByRole('button', {name: /French/}).click()

      await expect(languageLabel(page, 'en')).toBeVisible()
      await expect(languageLabel(page, 'es')).toHaveCount(0)
      await expect(languageLabel(page, 'fr')).toHaveCount(0)
    } finally {
      await deleteI18nPost(projectName, doc.id)
    }
  })
})

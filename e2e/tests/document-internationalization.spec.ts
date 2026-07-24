import {expect, test} from '@playwright/test'

import {
  cleanupLessonTree,
  deleteDocuments,
  languageOption,
  openLessonDocument,
  openTranslationsMenu,
  seedLesson,
  seedTranslationMetadata,
} from '../helpers/documentInternationalization.js'

test.describe('@sanity/document-internationalization', () => {
  test('shows Translations menu and language badge on a localized lesson', async ({
    page,
  }, testInfo) => {
    const projectName = testInfo.project.name
    const lesson = await seedLesson(projectName, {language: 'en'})

    try {
      await openLessonDocument(page, lesson.id)

      await expect(page.getByTestId('document-internationalization-menu')).toBeVisible()
      // Language badge label is the language id (e.g. "en")
      await expect(page.getByTestId('document-badges')).toContainText('en')

      await openTranslationsMenu(page)
      await expect(languageOption(page, 'English')).toBeVisible()
      await expect(languageOption(page, 'Spanish')).toBeVisible()
      await expect(languageOption(page, 'French')).toBeVisible()
    } finally {
      await cleanupLessonTree(projectName, lesson.id)
    }
  })

  test('creates a Spanish translation from an English lesson', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const lesson = await seedLesson(projectName, {
      language: 'en',
      title: 'English source lesson',
      content: 'Source content that should not copy',
    })

    try {
      await openLessonDocument(page, lesson.id)
      await openTranslationsMenu(page)

      const spanish = languageOption(page, 'Spanish')
      await expect(spanish).toBeEnabled()
      await spanish.click()

      await expect(page.getByText('Created "Spanish" translation')).toBeVisible()
      await expect(
        page.getByTestId('document-badges').filter({hasText: 'es'}).first(),
      ).toBeVisible()

      // Excluded `content` field should not be copied to the new translation.
      const spanishTitle = page
        .getByTestId('document-pane')
        .filter({has: page.getByTestId('document-badges').filter({hasText: 'es'})})
        .getByTestId('field-title')
        .getByTestId('string-input')
      const spanishContent = page
        .getByTestId('document-pane')
        .filter({has: page.getByTestId('document-badges').filter({hasText: 'es'})})
        .getByTestId('field-content')
        .locator('textarea, [data-testid="text-input"]')
        .first()

      await expect(spanishTitle).toHaveValue('English source lesson')
      await expect(spanishContent).toHaveValue('')
    } finally {
      await cleanupLessonTree(projectName, lesson.id)
    }
  })

  test('opens an existing translation from the Translations menu', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const english = await seedLesson(projectName, {
      language: 'en',
      title: 'Open-me English',
    })
    const spanish = await seedLesson(projectName, {
      language: 'es',
      title: 'Open-me Spanish',
    })
    const metadataId = await seedTranslationMetadata(projectName, [
      {language: 'en', documentId: english.id},
      {language: 'es', documentId: spanish.id},
    ])

    try {
      await openLessonDocument(page, english.id)
      await openTranslationsMenu(page)

      await languageOption(page, 'Spanish').click()

      const titleInputs = page.getByTestId('field-title').getByTestId('string-input')
      await expect(page.getByTestId('document-pane')).toHaveCount(2)
      await expect(titleInputs).toHaveCount(2)
      await expect(titleInputs.nth(1)).toHaveValue('Open-me Spanish')
    } finally {
      await deleteDocuments(projectName, [english.id, spanish.id, metadataId])
    }
  })

  test('Delete translation action unsets the metadata reference', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const english = await seedLesson(projectName, {language: 'en', title: 'Delete EN'})
    const spanish = await seedLesson(projectName, {language: 'es', title: 'Delete ES'})
    const metadataId = await seedTranslationMetadata(projectName, [
      {language: 'en', documentId: english.id},
      {language: 'es', documentId: spanish.id},
    ])

    try {
      await openLessonDocument(page, spanish.id)

      await page.getByTestId('action-menu-button').click()
      await page.getByRole('menuitem', {name: 'Delete translation...'}).click()

      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', {name: 'Unset translation reference'}).click()

      await expect(page.getByText('Translation reference unset')).toBeVisible()
    } finally {
      await deleteDocuments(projectName, [english.id, spanish.id, metadataId])
    }
  })

  test('Duplicate with translations creates a new linked set', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const english = await seedLesson(projectName, {language: 'en', title: 'Dup EN'})
    const french = await seedLesson(projectName, {language: 'fr', title: 'Dup FR'})
    const metadataId = await seedTranslationMetadata(projectName, [
      {language: 'en', documentId: english.id},
      {language: 'fr', documentId: french.id},
    ])

    try {
      await openLessonDocument(page, english.id)

      await page.getByTestId('action-menu-button').click()
      await page.getByRole('menuitem', {name: 'Duplicate with translations'}).click()

      await expect(page.getByTestId('document-pane').first()).toBeVisible()
      await expect(page).not.toHaveURL(new RegExp(english.id))

      await openTranslationsMenu(page)
      await expect(languageOption(page, 'English')).toBeVisible()
      await expect(languageOption(page, 'French')).toBeVisible()
    } finally {
      await deleteDocuments(projectName, [english.id, french.id, metadataId])
    }
  })

  test('Manage Translations opens the metadata document', async ({page}, testInfo) => {
    const projectName = testInfo.project.name
    const english = await seedLesson(projectName, {language: 'en', title: 'Meta EN'})
    const spanish = await seedLesson(projectName, {language: 'es', title: 'Meta ES'})
    const metadataId = await seedTranslationMetadata(projectName, [
      {language: 'en', documentId: english.id},
      {language: 'es', documentId: spanish.id},
    ])

    try {
      await openLessonDocument(page, english.id)
      await openTranslationsMenu(page)
      await page.getByRole('button', {name: 'Manage Translations'}).click()

      await expect(page.getByTestId('document-pane')).toHaveCount(2)
      await expect(page.getByText('Translations metadata').first()).toBeVisible()
    } finally {
      await deleteDocuments(projectName, [english.id, spanish.id, metadataId])
    }
  })
})

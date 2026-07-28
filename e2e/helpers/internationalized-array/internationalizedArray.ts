import {randomUUID} from 'node:crypto'

import {expect, type Page} from '@playwright/test'

import {createE2EClient} from '../e2eClient.js'
import {loadE2eEnvFiles, resolveE2eEnv} from '../env.js'

loadE2eEnvFiles()

const DOC_TYPE = 'i18nPost'
const LANGUAGE_FIELD_NAME = 'language'

export type SeededI18nPost = {
  id: string
}

export type I18nArrayItem = {
  _key: string
  _type: 'internationalizedArrayStringValue'
  language: string
  value?: string
}

function datasetForProject(projectName: string | undefined): string {
  const env = resolveE2eEnv()
  if (projectName === 'firefox') return env.datasetFirefox
  return env.datasetChromium
}

function item(language: string, value = ''): I18nArrayItem {
  return {
    _key: randomUUID(),
    _type: 'internationalizedArrayStringValue',
    [LANGUAGE_FIELD_NAME]: language,
    value,
  }
}

/**
 * Create an i18nPost draft via the Content Lake API.
 * Pass `title` / `summary` arrays explicitly — use `[]` when testing
 * `defaultLanguages` seeding (requires a persisted `_rev`).
 */
export async function seedI18nPost(
  projectName: string | undefined,
  opts: {
    title?: I18nArrayItem[]
    summary?: I18nArrayItem[]
  } = {},
): Promise<SeededI18nPost> {
  const client = createE2EClient(datasetForProject(projectName))
  const id = randomUUID()

  await client.createOrReplace({
    _id: `drafts.${id}`,
    _type: DOC_TYPE,
    title: opts.title ?? [],
    summary: opts.summary ?? [],
  })

  return {id}
}

export function languageItem(language: string, value?: string): I18nArrayItem {
  return item(language, value)
}

export async function deleteI18nPost(
  projectName: string | undefined,
  documentId: string,
): Promise<void> {
  const client = createE2EClient(datasetForProject(projectName))
  await client
    .transaction()
    .delete(documentId)
    .delete(`drafts.${documentId}`)
    .commit({visibility: 'async'})
    .catch(() => undefined)
}

export async function openI18nPost(page: Page, documentId: string): Promise<void> {
  // Relative to project baseURL (`…/chromium/` or `…/firefox/`, trailing slash
  // required). A leading `/` resolves against the host origin and drops the
  // workspace basePath ("Workspace not found").
  await page.goto(`intent/edit/id=${documentId};type=${DOC_TYPE}`)
  await expect(page.getByTestId('studio-navbar')).toBeVisible()
  await expect(page.getByTestId('document-pane').first()).toBeVisible()
  await expect(page.getByTestId('form-view').first()).toBeVisible()
}

/** Language code Label rendered as the nested value-field title (not add-button text). */
export function languageLabel(page: Page, languageId: string, fieldName = 'title') {
  return page
    .getByTestId(`field-${fieldName}`)
    .locator('[data-ui="Label"]')
    .getByText(languageId.toUpperCase(), {exact: true})
}

export function fieldAddButton(page: Page, languageId: string) {
  // Field-level add buttons live under the field — exclude the document panel.
  return page.getByTestId('field-title').getByTestId(`add-${languageId}`)
}

export function documentAddButton(page: Page, languageId: string) {
  return page.getByTestId('document-add-buttons').getByTestId(`add-${languageId}`)
}

export async function openLanguageFilter(page: Page) {
  const filterButton = page.getByRole('button', {name: /Showing \d+ \/ \d+|Showing all/})
  await expect(filterButton).toBeVisible()
  await filterButton.click()
  return filterButton
}

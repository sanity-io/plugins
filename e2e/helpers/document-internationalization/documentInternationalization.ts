import {randomUUID} from 'node:crypto'

import {expect, type Page} from '@playwright/test'

import {createE2EClient} from '../e2eClient.js'
import {loadE2eEnvFiles, resolveE2eEnv} from '../env.js'

loadE2eEnvFiles()

const METADATA_TYPE = 'translation.metadata'
/** Matches sanity-plugin-internationalized-array LANGUAGE_FIELD_NAME */
const LANGUAGE_FIELD_NAME = 'language'

export type SeededLesson = {
  id: string
  title: string
  language: string
  content?: string
}

function datasetForProject(projectName: string | undefined): string {
  const env = resolveE2eEnv()
  if (projectName === 'firefox') return env.datasetFirefox
  return env.datasetChromium
}

/**
 * Create a lesson draft (and optionally published) via the Content Lake API.
 */
export async function seedLesson(
  projectName: string | undefined,
  opts: {language: string; title?: string; content?: string; published?: boolean} = {
    language: 'en',
  },
): Promise<SeededLesson> {
  const client = createE2EClient(datasetForProject(projectName))
  const id = randomUUID()
  const title = opts.title ?? `Lesson ${opts.language} ${id.slice(0, 8)}`
  const content = opts.content ?? `Content for ${opts.language}`
  const doc = {
    _id: `drafts.${id}`,
    _type: 'lesson',
    title,
    language: opts.language,
    content,
  }

  await client.createOrReplace(doc)
  if (opts.published) {
    await client.createOrReplace({...doc, _id: id})
  }

  return {id, title, language: opts.language, content}
}

/**
 * Create a translation.metadata document linking the given lesson refs by language.
 */
export async function seedTranslationMetadata(
  projectName: string | undefined,
  translations: Array<{language: string; documentId: string}>,
): Promise<string> {
  const client = createE2EClient(datasetForProject(projectName))
  const metadataId = randomUUID()

  await client.createOrReplace({
    _id: metadataId,
    _type: METADATA_TYPE,
    schemaTypes: ['lesson'],
    translations: translations.map(({language, documentId}) => ({
      _key: randomUUID(),
      _type: 'internationalizedArrayReferenceValue',
      [LANGUAGE_FIELD_NAME]: language,
      value: {
        _type: 'reference',
        _ref: documentId,
        _weak: true,
        _strengthenOnPublish: {type: 'lesson'},
      },
    })),
  })

  return metadataId
}

export async function deleteDocuments(
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

/**
 * Delete a lesson and any translation.metadata docs that reference it,
 * plus sibling translation documents linked from that metadata.
 */
export async function cleanupLessonTree(
  projectName: string | undefined,
  documentId: string,
): Promise<void> {
  const client = createE2EClient(datasetForProject(projectName))
  const metadataDocs = await client.fetch<
    Array<{_id: string; translations?: Array<{value?: {_ref?: string}}>}>
  >(`*[_type == $type && $id in translations[].value._ref]{_id, translations}`, {
    type: METADATA_TYPE,
    id: documentId,
  })

  const ids = new Set<string>([documentId])
  for (const meta of metadataDocs) {
    ids.add(meta._id)
    for (const translation of meta.translations ?? []) {
      if (translation.value?._ref) ids.add(translation.value._ref)
    }
  }

  await deleteDocuments(projectName, [...ids])
}

export async function openLessonDocument(page: Page, documentId: string): Promise<void> {
  // Relative to project baseURL (`…/chromium/` or `…/firefox/`, trailing slash
  // required). A leading `/` resolves against the host origin and drops the
  // workspace basePath ("Workspace not found").
  await page.goto(`intent/edit/id=${documentId};type=lesson`)
  await expect(page.getByTestId('studio-navbar')).toBeVisible()
  await expect(page.getByTestId('document-pane').first()).toBeVisible()
  await expect(page.getByTestId('form-view').first()).toBeVisible()
}

export async function openTranslationsMenu(page: Page) {
  const menuButton = page.getByTestId('document-internationalization-menu')
  await expect(menuButton).toBeVisible()
  await expect(menuButton).toBeEnabled()
  await menuButton.click()
  await expect(page.getByRole('button', {name: 'Manage Translations'})).toBeVisible()
  return menuButton
}

export function languageOption(page: Page, languageTitle: string) {
  // Language buttons render title text + language id badge.
  return page.getByRole('button', {name: new RegExp(`^${languageTitle}\\b`, 'i')})
}

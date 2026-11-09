import {evaluate, parse} from 'groq-js'
import {describe, expect, test} from 'vitest'

import {createMockMetadata, createMockTranslation} from './test/helpers'
import {validateTranslationReferenceLanguage} from './validateTranslationReference'

const RELEASE_ID = 'DRG5JUqV'
const PUBLISHED_ID = '3cf5e007-bec2-4b73-b710-3dcd8cab9965'
const METADATA_ID = `versions.${RELEASE_ID}.007fa08b-5068-46c8-b4ca-b2bfe71f204a`
const SAME_RELEASE_ID = `versions.${RELEASE_ID}.${PUBLISHED_ID}`
const OTHER_RELEASE_ID = `versions.otherRelease.${PUBLISHED_ID}`
const LANGUAGE_MISMATCH = 'Referenced document does not have the correct language value'

type StoredDocument = {_id: string; _type: string; language?: string}

function document(id: string, language: string): StoredDocument {
  return {_id: id, _type: 'article', language}
}

function groqClient(dataset: StoredDocument[]) {
  return {
    async fetch(query: string, params: Record<string, unknown>) {
      const value = await evaluate(parse(query), {dataset, params})
      return value.get()
    },
  }
}

async function validate(documentId: string, dataset: StoredDocument[], language: string) {
  const item = createMockTranslation(language, PUBLISHED_ID)
  const metadata = createMockMetadata(documentId, [item])
  return validateTranslationReferenceLanguage(
    item,
    {
      document: metadata,
      getClient: () => groqClient(dataset),
    },
    'language',
  )
}

describe('translation reference language validation', () => {
  test('accepts a translation that exists only in the metadata document release', async () => {
    const result = await validate(METADATA_ID, [document(SAME_RELEASE_ID, 'es-ES')], 'es-ES')

    expect(result).toBe(true)
  })

  test('rejects a translation that exists only in a different release', async () => {
    const result = await validate(METADATA_ID, [document(OTHER_RELEASE_ID, 'es-ES')], 'es-ES')

    expect(result).toBe(LANGUAGE_MISMATCH)
  })

  test('uses the same-release version when its language differs from the published document', async () => {
    const matchingVersion = await validate(
      METADATA_ID,
      [document(PUBLISHED_ID, 'en'), document(SAME_RELEASE_ID, 'es-ES')],
      'es-ES',
    )
    const conflictingVersion = await validate(
      METADATA_ID,
      [document(PUBLISHED_ID, 'es-ES'), document(SAME_RELEASE_ID, 'en')],
      'es-ES',
    )

    expect(matchingVersion).toBe(true)
    expect(conflictingVersion).toBe(LANGUAGE_MISMATCH)
  })

  test('does not inherit the published language when the release version has none', async () => {
    const result = await validate(
      METADATA_ID,
      [{_id: SAME_RELEASE_ID, _type: 'article'}, document(PUBLISHED_ID, 'es-ES')],
      'es-ES',
    )

    expect(result).toBe(LANGUAGE_MISMATCH)
  })

  test('accepts the published document when this release has no version of it', async () => {
    const result = await validate(
      METADATA_ID,
      [document(PUBLISHED_ID, 'es-ES'), document(OTHER_RELEASE_ID, 'en')],
      'es-ES',
    )

    expect(result).toBe(true)
  })

  test('accepts a draft when this release has no version of the translation', async () => {
    const result = await validate(
      METADATA_ID,
      [document(`drafts.${PUBLISHED_ID}`, 'es-ES')],
      'es-ES',
    )

    expect(result).toBe(true)
  })

  test('accepts a draft when the metadata document is not in a release', async () => {
    const result = await validate(
      '007fa08b-5068-46c8-b4ca-b2bfe71f204a',
      [document(`drafts.${PUBLISHED_ID}`, 'es-ES')],
      'es-ES',
    )

    expect(result).toBe(true)
  })

  test('rejects a release-only translation when the metadata document is not in a release', async () => {
    const result = await validate(
      '007fa08b-5068-46c8-b4ca-b2bfe71f204a',
      [document(SAME_RELEASE_ID, 'es-ES')],
      'es-ES',
    )

    expect(result).toBe(LANGUAGE_MISMATCH)
  })
})

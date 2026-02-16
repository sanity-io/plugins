import {
  createSchema,
  defineField,
  defineType,
  type DocumentActionProps,
  type SanityDocument,
} from 'sanity'
import {LANGUAGE_FIELD_NAME} from 'sanity-plugin-internationalized-array'
import {vi} from 'vitest'

import type {Language, PluginConfigContext, TranslationReference, MetadataDocument} from '../types'

import {DEFAULT_CONFIG, TRANSLATIONS_ARRAY_NAME} from '../constants'

/**
 * Shared mock language definitions for tests.
 */
export const MOCK_LANGUAGES: Language[] = [
  {id: 'en', title: 'English'},
  {id: 'fr', title: 'French'},
  {id: 'es', title: 'Spanish'},
  {id: 'de', title: 'German'},
]

/**
 * Default plugin config for tests.
 */
export const MOCK_PLUGIN_CONFIG: PluginConfigContext = {
  ...DEFAULT_CONFIG,
  supportedLanguages: MOCK_LANGUAGES,
  schemaTypes: ['article', 'page'],
}

/**
 * Creates a mock document with the given language.
 */
export function createMockDocument(
  id: string,
  language?: string,
  opts?: {type?: string; languageField?: string},
): SanityDocument {
  const languageField = opts?.languageField ?? 'language'
  return {
    _id: id,
    _type: opts?.type ?? 'article',
    _rev: 'test-rev',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
    [languageField]: language,
  }
}

/**
 * Creates a mock translation reference.
 *
 * Note: Currently uses `_key: languageId` (pre-migration format).
 * When migrating to `{_key: random, language: languageId}`, update this factory.
 */
export function createMockTranslation(
  languageId: string,
  ref: string,
  opts?: {weak?: boolean; strengthenOnPublish?: boolean; type?: string},
): TranslationReference {
  const strengthenOnPublish = opts?.strengthenOnPublish ?? true
  const type = opts?.type ?? 'article'

  return {
    ...(LANGUAGE_FIELD_NAME === '_key' ? {} : {_key: `key-${languageId}`}),
    [LANGUAGE_FIELD_NAME]: languageId,
    _type: 'internationalizedArrayReferenceValue',
    value: {
      _type: 'reference',
      _ref: ref,
      _weak: opts?.weak ?? true,
      ...(strengthenOnPublish ? {_strengthenOnPublish: {type}} : {}),
    },
  }
}

/**
 * Creates a mock metadata document with translations.
 */
export function createMockMetadata(
  id: string,
  translations: TranslationReference[],
  opts?: {createdAt?: string; schemaTypes?: string[]},
): SanityDocument & MetadataDocument {
  return {
    _id: id,
    _type: 'translation.metadata',
    schemaTypes: opts?.schemaTypes ?? [],
    _createdAt: opts?.createdAt ?? '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
    _rev: 'test-rev',
    [TRANSLATIONS_ARRAY_NAME]: translations,
  }
}

export const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'article',
      type: 'document',
      fields: [
        defineField({
          name: 'title',
          type: 'string',
        }),
      ],
    }),
  ],
})

export function createActionProps(opts: {
  draft?: SanityDocument | null
  published?: SanityDocument | null
}): DocumentActionProps {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return {
    id: opts.draft?._id?.replace('drafts.', '') ?? opts.published?._id ?? 'meta-1',
    type: 'translation.metadata',
    draft: opts.draft ?? null,
    published: opts.published ?? null,
    liveEdit: true,
    onComplete: vi.fn(),
  } as unknown as DocumentActionProps
}

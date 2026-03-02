/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import type {DocumentBadgeProps, SanityDocument} from 'sanity'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {useDocumentInternationalizationContext} from '../components/DocumentInternationalizationContext'
import {MOCK_LANGUAGES, MOCK_PLUGIN_CONFIG} from '../test/helpers'
import {LanguageBadge} from './index'

vi.mock('../components/DocumentInternationalizationContext', () => ({
  useDocumentInternationalizationContext: vi.fn(),
}))

function createBadgeProps(opts: {
  draft?: Partial<SanityDocument> | null
  published?: Partial<SanityDocument> | null
}): DocumentBadgeProps {
  return {
    draft: opts.draft as SanityDocument | null,
    published: opts.published as SanityDocument | null,
  } as DocumentBadgeProps
}

describe('LanguageBadge', () => {
  beforeEach(() => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue(MOCK_PLUGIN_CONFIG)
  })

  test('returns null when no document exists', () => {
    const props = createBadgeProps({draft: null, published: null})
    const result = LanguageBadge(props)
    expect(result).toBeNull()
  })

  test('returns null when language field has no value', () => {
    const props = createBadgeProps({
      draft: {_id: 'doc-1', _type: 'article'},
    })
    const result = LanguageBadge(props)
    expect(result).toBeNull()
  })

  test('returns null when language field value is not a string', () => {
    const props = createBadgeProps({
      draft: {_id: 'doc-1', _type: 'article', language: 123},
    })
    const result = LanguageBadge(props)
    expect(result).toBeNull()
  })

  test('returns badge with language.id as label when language found in supportedLanguages', () => {
    const props = createBadgeProps({
      draft: {_id: 'doc-1', _type: 'article', language: 'en'},
    })
    const result = LanguageBadge(props)

    expect(result).not.toBeNull()
    expect(result!.label).toBe('en')
  })

  test('returns badge with language.title as title when language found', () => {
    const props = createBadgeProps({
      draft: {_id: 'doc-1', _type: 'article', language: 'en'},
    })
    const result = LanguageBadge(props)

    expect(result!.title).toBe('English')
  })

  test('returns badge with raw languageId as label when language not in supportedLanguages', () => {
    const props = createBadgeProps({
      draft: {_id: 'doc-1', _type: 'article', language: 'ja'},
    })
    const result = LanguageBadge(props)

    expect(result).not.toBeNull()
    expect(result!.label).toBe('ja')
  })

  test('returns badge with undefined title when language not in supportedLanguages', () => {
    const props = createBadgeProps({
      draft: {_id: 'doc-1', _type: 'article', language: 'ja'},
    })
    const result = LanguageBadge(props)

    expect(result!.title).toBeUndefined()
  })

  test('uses primary color', () => {
    const props = createBadgeProps({
      draft: {_id: 'doc-1', _type: 'article', language: 'en'},
    })
    const result = LanguageBadge(props)

    expect(result!.color).toBe('primary')
  })

  test('prefers draft document over published', () => {
    const props = createBadgeProps({
      draft: {_id: 'drafts.doc-1', _type: 'article', language: 'fr'},
      published: {_id: 'doc-1', _type: 'article', language: 'en'},
    })
    const result = LanguageBadge(props)

    expect(result!.label).toBe('fr')
    expect(result!.title).toBe('French')
  })

  test('uses published document when no draft exists', () => {
    const props = createBadgeProps({
      draft: null,
      published: {_id: 'doc-1', _type: 'article', language: 'es'},
    })
    const result = LanguageBadge(props)

    expect(result!.label).toBe('es')
    expect(result!.title).toBe('Spanish')
  })

  test('uses custom languageField from config', () => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue({
      ...MOCK_PLUGIN_CONFIG,
      languageField: 'locale',
    })

    const props = createBadgeProps({
      draft: {_id: 'doc-1', _type: 'article', locale: 'de'},
    })
    const result = LanguageBadge(props)

    expect(result!.label).toBe('de')
    expect(result!.title).toBe('German')
  })

  test('returns badge with raw language ID when language is not found in supportedLanguages', () => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue({
      ...MOCK_PLUGIN_CONFIG,
      supportedLanguages: MOCK_LANGUAGES,
    })

    const props = createBadgeProps({
      draft: {_id: 'doc-1', _type: 'article', language: 'zh'},
    })
    const result = LanguageBadge(props)

    expect(result).not.toBeNull()
    expect(result!.label).toBe('zh')
  })

  test('returns badge with raw languageId and no title when supportedLanguages is not an array', () => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue({
      ...MOCK_PLUGIN_CONFIG,
      // Simulate async languages that have not resolved yet (non-array at runtime)
      supportedLanguages: (() => Promise.resolve([])) as unknown as typeof MOCK_LANGUAGES,
    })

    const props = createBadgeProps({
      draft: {_id: 'doc-1', _type: 'article', language: 'en'},
    })
    const result = LanguageBadge(props)

    expect(result).not.toBeNull()
    expect(result!.label).toBe('en')
    expect(result!.title).toBeUndefined()
  })
})

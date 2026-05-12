import {describe, expect, test, vi} from 'vitest'

import {MOCK_LANGUAGES} from '../test/helpers'
import type {Language} from '../types'
import {composeFilteredLanguages} from './InternationalizedArrayContext'

// Hoisted filter helpers — keeping them at module scope satisfies
// unicorn/consistent-function-scoping (these don't capture test-local state).
const reorderToFrEn = (): Language[] => [
  {id: 'fr', title: 'French'},
  {id: 'en', title: 'English'},
]

const allowEnFrEs = ({defaultLanguages}: {defaultLanguages: Language[]}): Language[] =>
  defaultLanguages.filter((l) => ['en', 'fr', 'es'].includes(l.id))

const ghostLanguage: Language = {id: 'xx', title: 'Ghost'}
const returnGhost = (): Language[] => [ghostLanguage]

const returnEmpty = (): Language[] => []

describe('composeFilteredLanguages', () => {
  test('returns the full list when no filterLanguages and language-filter not enabled', () => {
    const result = composeFilteredLanguages({
      languages: MOCK_LANGUAGES,
      schemaType: 'article',
      filterLanguages: null,
      selectedLanguageIds: [],
      languageFilterDocumentTypes: [],
    })

    expect(result).toEqual(MOCK_LANGUAGES)
  })

  test('applies filterLanguages when configured', () => {
    const filterLanguages = vi.fn(
      ({defaultLanguages}: {defaultLanguages: Language[]}): Language[] =>
        defaultLanguages.filter((l) => l.id === 'en' || l.id === 'fr'),
    )

    const result = composeFilteredLanguages({
      languages: MOCK_LANGUAGES,
      schemaType: 'article',
      filterLanguages,
      selectedLanguageIds: [],
      languageFilterDocumentTypes: [],
    })

    expect(filterLanguages).toHaveBeenCalledWith({
      schemaType: 'article',
      defaultLanguages: MOCK_LANGUAGES,
    })
    expect(result.map((l) => l.id)).toEqual(['en', 'fr'])
  })

  test('preserves filterLanguages return order', () => {
    const result = composeFilteredLanguages({
      languages: MOCK_LANGUAGES,
      schemaType: 'article',
      filterLanguages: reorderToFrEn,
      selectedLanguageIds: [],
      languageFilterDocumentTypes: [],
    })

    expect(result.map((l) => l.id)).toEqual(['fr', 'en'])
  })

  test('returns [] when filterLanguages returns []', () => {
    const result = composeFilteredLanguages({
      languages: MOCK_LANGUAGES,
      schemaType: 'article',
      filterLanguages: returnEmpty,
      selectedLanguageIds: [],
      languageFilterDocumentTypes: [],
    })

    expect(result).toEqual([])
  })

  test('composes filterLanguages with @sanity/language-filter user selection', () => {
    // Static filter narrows to en/fr/es.
    // User-selection filter is enabled for this document type and the user
    // has selected en + es. Final menu should be en + es (intersection).
    const result = composeFilteredLanguages({
      languages: MOCK_LANGUAGES,
      schemaType: 'article',
      filterLanguages: allowEnFrEs,
      selectedLanguageIds: ['en', 'es', 'de'], // 'de' was never in static set, so irrelevant
      languageFilterDocumentTypes: ['article'],
    })

    expect(result.map((l) => l.id)).toEqual(['en', 'es'])
  })

  test('language-filter user selection is ignored when the document type is not enabled', () => {
    const result = composeFilteredLanguages({
      languages: MOCK_LANGUAGES,
      schemaType: 'article',
      filterLanguages: null,
      selectedLanguageIds: ['en'],
      languageFilterDocumentTypes: ['someOtherType'], // article not in list
    })

    expect(result).toEqual(MOCK_LANGUAGES)
  })

  test('static filter receives the document schemaType', () => {
    const filterLanguages = vi.fn(
      ({defaultLanguages}: {defaultLanguages: Language[]}): Language[] => defaultLanguages,
    )

    composeFilteredLanguages({
      languages: MOCK_LANGUAGES,
      schemaType: 'recipe',
      filterLanguages,
      selectedLanguageIds: [],
      languageFilterDocumentTypes: [],
    })

    expect(filterLanguages).toHaveBeenCalledWith({
      schemaType: 'recipe',
      defaultLanguages: MOCK_LANGUAGES,
    })
  })

  test('static filter ignores languages that are not in the resolved set (it operates on defaultLanguages)', () => {
    // If a misconfigured filter returns languages that aren't in the input,
    // they pass through (the type system already prevents this in practice,
    // but documenting the runtime contract).
    const result = composeFilteredLanguages({
      languages: MOCK_LANGUAGES,
      schemaType: 'article',
      filterLanguages: returnGhost,
      selectedLanguageIds: [],
      languageFilterDocumentTypes: [],
    })

    expect(result).toEqual([ghostLanguage])
  })
})

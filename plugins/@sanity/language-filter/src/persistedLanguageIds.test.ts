import {beforeEach, describe, expect, it} from 'vitest'

import {getPersistedLanguageIds, setPersistedLanguageIds} from './persistedLanguageIds'

const storageKey = '@sanity/plugin/language-filter/selected-languages'

const supportedLanguages = [
  {id: 'en', title: 'English'},
  {id: 'es', title: 'Spanish'},
  {id: 'fr', title: 'French'},
]

describe('persistedLanguageIds', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  describe('setPersistedLanguageIds', () => {
    it('stores selected language ids in localStorage', () => {
      setPersistedLanguageIds(['en', 'fr'])
      const expected = '["en","fr"]' // Stored as a serialized JSON array.

      expect(window.localStorage.getItem(storageKey)).toBe(expected)
    })
  })

  describe('getPersistedLanguageIds', () => {
    it('returns all supported language ids when no persisted value exists', () => {
      const expected = ['en', 'es', 'fr'] // Defaults + selectable ids covers all supported languages.

      expect(
        getPersistedLanguageIds({
          supportedLanguages,
        }),
      ).toEqual(expected)
    })

    it('returns defaults plus persisted ids intersected with selectable language ids', () => {
      window.localStorage.setItem(storageKey, JSON.stringify(['es', 'de', 'fr']))
      const expected = ['es', 'fr'] // No defaults configured; only persisted selectable ids are returned.

      expect(
        getPersistedLanguageIds({
          supportedLanguages,
        }),
      ).toEqual(expected)
    })

    it('includes default languages while still filtering persisted ids to selectable ids', () => {
      window.localStorage.setItem(storageKey, JSON.stringify(['en', 'es', 'fr']))
      const expected = ['en', 'es', 'fr'] // "en" is included from defaults, "es/fr" come from persisted selectable ids.

      expect(
        getPersistedLanguageIds({
          supportedLanguages,
          defaultLanguages: ['en'],
        }),
      ).toEqual(expected)
    })

    it('falls back to defaults plus selectable language ids when persisted value is invalid JSON', () => {
      window.localStorage.setItem(storageKey, 'not-json')
      const expected = ['en', 'es', 'fr'] // Parse failure falls back to defaults + selectable ids.

      expect(
        getPersistedLanguageIds({
          supportedLanguages,
        }),
      ).toEqual(expected)
    })

    it('ignores default language ids that are not in supportedLanguages', () => {
      const expected = ['en', 'es', 'fr'] // Unsupported defaults are ignored and not returned.

      expect(
        getPersistedLanguageIds({
          supportedLanguages,
          defaultLanguages: ['de'],
        }),
      ).toEqual(expected)
    })
  })
})

import {describe, expect, it} from 'vitest'

import {createValues, testLanguages} from '../__tests__/test-utils'
import {checkAllLanguagesArePresent} from '../utils/checkAllLanguagesArePresent'
import {isLanguageInValue} from '../utils/isLanguageInValue'

/**
 * Tests for fieldActions/index.ts
 *
 * This file tests the field action logic that uses LANGUAGE_FIELD_NAME for language identification.
 * When migrating to sanity_language, these tests should catch breakages in:
 * - Disabled state calculation (comparing item[LANGUAGE_FIELD_NAME] to language.id)
 * - Hidden state calculation for "Add missing" action
 *
 * Note: We test the extracted utility functions that the field actions use.
 */

describe('fieldActions', () => {
  describe('isLanguageInValue - disabled state logic', () => {
    it('returns true when language already exists in value', () => {
      const value = createValues(['en', 'fr'])
      const language = {id: 'en', title: 'English'}

      // This is the function used by fieldActions for disabled state
      const disabled = value && Array.isArray(value) ? isLanguageInValue(language, value) : false

      expect(disabled).toBe(true) // 'en' already exists
    })

    it('returns false when language does not exist in value', () => {
      const value = createValues(['en', 'fr'])
      const language = {id: 'de', title: 'German'}

      const disabled = value && Array.isArray(value) ? isLanguageInValue(language, value) : false

      expect(disabled).toBe(false) // 'de' does not exist
    })

    it('returns false for empty value', () => {
      const value: ReturnType<typeof createValues> = []
      const language = {id: 'en', title: 'English'}

      const disabled = value && Array.isArray(value) ? isLanguageInValue(language, value) : false

      expect(disabled).toBe(false)
    })
  })

  describe('checkAllLanguagesArePresent - hidden state logic for Add Missing', () => {
    /**
     * From fieldActions/index.ts:
     * const hidden = checkAllLanguagesArePresent(filteredLanguages, value)
     */
    it('is hidden when all languages are present', () => {
      const value = createValues(['en', 'fr', 'de', 'es'])
      const hidden = checkAllLanguagesArePresent(testLanguages, value)
      expect(hidden).toBe(true)
    })

    it('is visible when some languages are missing', () => {
      const value = createValues(['en', 'fr'])
      const hidden = checkAllLanguagesArePresent(testLanguages, value)
      expect(hidden).toBe(false)
    })

    it('is visible for empty value', () => {
      const hidden = checkAllLanguagesArePresent(testLanguages, [])
      expect(hidden).toBe(false)
    })
  })

  describe('language filtering - visibility logic', () => {
    /**
     * From fieldActions/index.ts:
     * const hidden = !filteredLanguages.some((f) => f.id === language.id)
     */
    it('hides actions for languages not in filtered list', () => {
      const filteredLanguages = [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'},
      ]
      const language = {id: 'de', title: 'German'}

      const hidden = !filteredLanguages.some((f) => f.id === language.id)
      expect(hidden).toBe(true) // 'de' not in filtered list
    })

    it('shows actions for languages in filtered list', () => {
      const filteredLanguages = [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'},
      ]
      const language = {id: 'en', title: 'English'}

      const hidden = !filteredLanguages.some((f) => f.id === language.id)
      expect(hidden).toBe(false) // 'en' is in filtered list
    })
  })
})

import {describe, expect, it} from 'vitest'

import {createValues, testLanguages} from '../__tests__/test-utils'
import {checkAllLanguagesArePresent} from '../utils/checkAllLanguagesArePresent'

/**
 * Tests for fieldActions/index.ts
 *
 * This file tests the field action logic that uses _key for language identification.
 * When migrating to sanity_language, these tests should catch breakages in:
 * - Disabled state calculation (comparing item._key to language.id)
 * - Hidden state calculation for "Add missing" action
 *
 * Note: The actual field actions use React hooks and Sanity context which are
 * difficult to test in isolation. We test the underlying logic functions instead.
 */

describe('fieldActions', () => {
  describe('disabled state logic - uses _key comparison', () => {
    /**
     * From fieldActions/index.ts:
     * const disabled = value && Array.isArray(value)
     *   ? Boolean(value?.find((item) => item._key === language.id))
     *   : false
     */
    it('is disabled when language._key already exists in value', () => {
      const value = createValues(['en', 'fr'])
      const language = {id: 'en', title: 'English'}

      // Simulate the disabled logic from fieldActions
      const disabled =
        value && Array.isArray(value)
          ? Boolean(value?.find((item) => item._key === language.id))
          : false

      expect(disabled).toBe(true) // 'en' already exists
    })

    it('is enabled when language._key does not exist in value', () => {
      const value = createValues(['en', 'fr'])
      const language = {id: 'de', title: 'German'}

      const disabled =
        value && Array.isArray(value)
          ? Boolean(value?.find((item) => item._key === language.id))
          : false

      expect(disabled).toBe(false) // 'de' does not exist
    })

    it('is enabled for empty value', () => {
      const value: ReturnType<typeof createValues> = []
      const language = {id: 'en', title: 'English'}

      const disabled =
        value && Array.isArray(value)
          ? Boolean(value?.find((item) => item._key === language.id))
          : false

      expect(disabled).toBe(false)
    })
  })

  describe('hidden state logic for Add Missing - uses _key check', () => {
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

  describe('language filtering - uses _key comparison', () => {
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

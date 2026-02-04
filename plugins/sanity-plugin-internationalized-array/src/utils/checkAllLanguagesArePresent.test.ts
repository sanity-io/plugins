import {describe, expect, it} from 'vitest'

import {createValues, testLanguages, twoLanguages} from '../__tests__/test-utils'
import {checkAllLanguagesArePresent} from './checkAllLanguagesArePresent'

/**
 * Tests for utils/checkAllLanguagesArePresent.ts
 *
 * This file tests the presence check logic that uses _key as the language identifier.
 * When migrating to sanity_language, these tests should catch breakages in:
 * - Checking if all language IDs are present in the value array (via item._key)
 * - Comparing value._key to language.id
 */

describe('checkAllLanguagesArePresent', () => {
  describe('all languages present - uses _key for identification', () => {
    it('returns true when all languages are present', () => {
      // All languages have corresponding _key values
      const value = createValues(['en', 'fr'])
      const result = checkAllLanguagesArePresent(twoLanguages, value)
      expect(result).toBe(true)
    })

    it('returns true when languages match exactly', () => {
      // Perfect 1:1 match between value._key and language.id
      const value = createValues(['en', 'fr', 'de', 'es'])
      const result = checkAllLanguagesArePresent(testLanguages, value)
      expect(result).toBe(true)
    })
  })

  describe('missing languages - uses _key for identification', () => {
    it('returns false when languages are missing', () => {
      // 'fr' is missing (no item with _key: 'fr')
      const value = createValues(['en'])
      const result = checkAllLanguagesArePresent(twoLanguages, value)
      expect(result).toBe(false)
    })

    it('returns false when all languages are missing', () => {
      const result = checkAllLanguagesArePresent(twoLanguages, [])
      expect(result).toBe(false)
    })

    it('returns false when some languages are missing', () => {
      // Only 'en' and 'fr' present, missing 'de' and 'es'
      const value = createValues(['en', 'fr'])
      const result = checkAllLanguagesArePresent(testLanguages, value)
      expect(result).toBe(false)
    })
  })

  describe('empty/undefined handling', () => {
    it('returns false for empty value', () => {
      const result = checkAllLanguagesArePresent(twoLanguages, [])
      expect(result).toBe(false)
    })

    it('returns false for undefined value', () => {
      const result = checkAllLanguagesArePresent(twoLanguages, undefined)
      expect(result).toBe(false)
    })

    it('returns true for empty languages array with empty value', () => {
      const result = checkAllLanguagesArePresent([], [])
      expect(result).toBe(true)
    })

    it('returns true for empty languages array with undefined value', () => {
      const result = checkAllLanguagesArePresent([], undefined)
      expect(result).toBe(true)
    })
  })

  describe('extra languages in value', () => {
    it('returns false when value has extra languages not in filter', () => {
      // Value has 'en', 'fr', 'de' but languages only specifies 'en', 'fr'
      // The function checks that ALL filtered languages are present AND lengths match
      const value = createValues(['en', 'fr', 'de'])
      const result = checkAllLanguagesArePresent(twoLanguages, value)
      expect(result).toBe(false)
    })
  })

  describe('_key matching behavior', () => {
    it('matches by exact _key value', () => {
      // _key must exactly match language.id
      const value = createValues(['en', 'fr'])
      const result = checkAllLanguagesArePresent(twoLanguages, value)
      expect(result).toBe(true)
    })

    it('does not match by case-insensitive comparison', () => {
      // 'EN' !== 'en', so this should fail
      const value = createValues(['EN', 'FR'])
      const result = checkAllLanguagesArePresent(twoLanguages, value)
      expect(result).toBe(false)
    })

    it('handles language ids with special characters', () => {
      const languages = [
        {id: 'en-US', title: 'English (US)'},
        {id: 'pt-BR', title: 'Portuguese (Brazil)'},
      ]
      const value = createValues(['en-US', 'pt-BR'])
      const result = checkAllLanguagesArePresent(languages, value)
      expect(result).toBe(true)
    })
  })
})

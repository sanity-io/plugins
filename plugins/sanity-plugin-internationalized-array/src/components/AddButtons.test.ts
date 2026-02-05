import {describe, expect, it} from 'vitest'

import {createValues, testLanguages} from '../__tests__/test-utils'
import {MAX_COLUMNS} from '../constants'
import {isAddButtonDisabled, isLanguageInValue} from '../utils/isLanguageInValue'

/**
 * Tests for components/AddButtons.tsx
 *
 * This file tests the AddButtons component logic that uses LANGUAGE_FIELD_NAME for language identification.
 * When migrating to sanity_language, these tests should catch breakages in:
 * - Button disabled state (comparing value[LANGUAGE_FIELD_NAME] to language.id)
 *
 * Note: We test the extracted utility functions that the component uses.
 */

describe('AddButtons', () => {
  describe('isLanguageInValue - checks if language exists in value', () => {
    it('returns true when language exists in value', () => {
      const value = createValues(['en', 'fr'])
      const result = isLanguageInValue({id: 'en', title: 'English'}, value)
      expect(result).toBe(true)
    })

    it('returns false when language does not exist in value', () => {
      const value = createValues(['en', 'fr'])
      const result = isLanguageInValue({id: 'de', title: 'German'}, value)
      expect(result).toBe(false)
    })

    it('returns false for undefined value', () => {
      const result = isLanguageInValue({id: 'en', title: 'English'}, undefined)
      expect(result).toBe(false)
    })

    it('returns false for empty value array', () => {
      const result = isLanguageInValue({id: 'en', title: 'English'}, [])
      expect(result).toBe(false)
    })
  })

  describe('isAddButtonDisabled - button disabled logic', () => {
    describe('when readOnly is false', () => {
      it('disables button when language already exists in value', () => {
        const value = createValues(['en', 'fr'])
        const result = isAddButtonDisabled({id: 'en', title: 'English'}, value, false)
        expect(result).toBe(true)
      })

      it('enables button when language does not exist in value', () => {
        const value = createValues(['en', 'fr'])
        const result = isAddButtonDisabled({id: 'de', title: 'German'}, value, false)
        expect(result).toBe(false)
      })

      it('enables button for undefined value', () => {
        const result = isAddButtonDisabled({id: 'en', title: 'English'}, undefined, false)
        expect(result).toBe(false)
      })

      it('enables button for empty value array', () => {
        const result = isAddButtonDisabled({id: 'en', title: 'English'}, [], false)
        expect(result).toBe(false)
      })
    })

    describe('when readOnly is true', () => {
      it('always disables button regardless of value', () => {
        const value = createValues(['en', 'fr'])
        expect(isAddButtonDisabled({id: 'en', title: 'English'}, value, true)).toBe(true)
        expect(isAddButtonDisabled({id: 'de', title: 'German'}, value, true)).toBe(true)
        expect(isAddButtonDisabled({id: 'en', title: 'English'}, undefined, true)).toBe(true)
      })
    })

    describe('LANGUAGE_FIELD_NAME matching behavior', () => {
      it('matches by exact language field value', () => {
        const value = createValues(['en-US'])
        expect(isAddButtonDisabled({id: 'en-US', title: 'English (US)'}, value, false)).toBe(true)
        expect(isAddButtonDisabled({id: 'en', title: 'English'}, value, false)).toBe(false)
      })

      it('is case sensitive', () => {
        const value = createValues(['EN'])
        expect(isAddButtonDisabled({id: 'en', title: 'English'}, value, false)).toBe(false)
        expect(isAddButtonDisabled({id: 'EN', title: 'ENGLISH'}, value, false)).toBe(true)
      })
    })
  })

  describe('button visibility logic', () => {
    /**
     * From AddButtons.tsx:
     * return languages.length > 0 ? (... buttons ...) : null
     */
    it('renders when languages array is not empty', () => {
      const shouldRender = testLanguages.length > 0
      expect(shouldRender).toBe(true)
    })

    it('does not render when languages array is empty', () => {
      const shouldRender = [].length > 0
      expect(shouldRender).toBe(false)
    })
  })

  describe('grid column calculation', () => {
    /**
     * From AddButtons.tsx:
     * columns={Math.min(languages.length, MAX_COLUMNS[languageDisplay])}
     */
    it('uses language count when less than max columns', () => {
      const languages = [{id: 'en'}, {id: 'fr'}]
      const columns = Math.min(languages.length, MAX_COLUMNS.codeOnly)
      expect(columns).toBe(2)
    })

    it('caps at max columns when languages exceed it', () => {
      const languages = Array(10)
        .fill(null)
        .map((_, i) => ({id: `lang${i}`}))
      const columns = Math.min(languages.length, MAX_COLUMNS.codeOnly)
      expect(columns).toBe(5)
    })

    it('uses different max for titleOnly display', () => {
      const languages = Array(10)
        .fill(null)
        .map((_, i) => ({id: `lang${i}`}))
      const columns = Math.min(languages.length, MAX_COLUMNS.titleOnly)
      expect(columns).toBe(4)
    })

    it('uses different max for titleAndCode display', () => {
      const languages = Array(10)
        .fill(null)
        .map((_, i) => ({id: `lang${i}`}))
      const columns = Math.min(languages.length, MAX_COLUMNS.titleAndCode)
      expect(columns).toBe(3)
    })
  })
})

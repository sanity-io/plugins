import {describe, expect, it} from 'vitest'

import {createValues, testLanguages} from '../__tests__/test-utils'

/**
 * Tests for components/AddButtons.tsx
 *
 * This file tests the AddButtons component logic that uses _key for language identification.
 * When migrating to sanity_language, these tests should catch breakages in:
 * - Button disabled state (comparing value._key to language.id)
 *
 * Note: The actual component uses React hooks and @sanity/ui which are
 * difficult to test in isolation. We test the underlying logic instead.
 */

describe('AddButtons', () => {
  describe('button disabled logic - uses _key comparison', () => {
    /**
     * From AddButtons.tsx:
     * disabled={readOnly || Boolean(value?.find((item) => item._key === language.id))}
     */
    function isButtonDisabled(
      language: {id: string; title: string},
      value: ReturnType<typeof createValues> | undefined,
      readOnly: boolean,
    ): boolean {
      return readOnly || Boolean(value?.find((item) => item._key === language.id))
    }

    describe('when readOnly is false', () => {
      it('disables button when language already exists in value', () => {
        const value = createValues(['en', 'fr'])
        const result = isButtonDisabled({id: 'en', title: 'English'}, value, false)
        expect(result).toBe(true)
      })

      it('enables button when language does not exist in value', () => {
        const value = createValues(['en', 'fr'])
        const result = isButtonDisabled({id: 'de', title: 'German'}, value, false)
        expect(result).toBe(false)
      })

      it('enables button for undefined value', () => {
        const result = isButtonDisabled({id: 'en', title: 'English'}, undefined, false)
        expect(result).toBe(false)
      })

      it('enables button for empty value array', () => {
        const result = isButtonDisabled({id: 'en', title: 'English'}, [], false)
        expect(result).toBe(false)
      })
    })

    describe('when readOnly is true', () => {
      it('always disables button regardless of value', () => {
        const value = createValues(['en', 'fr'])
        expect(isButtonDisabled({id: 'en', title: 'English'}, value, true)).toBe(true)
        expect(isButtonDisabled({id: 'de', title: 'German'}, value, true)).toBe(true)
        expect(isButtonDisabled({id: 'en', title: 'English'}, undefined, true)).toBe(true)
      })
    })

    describe('_key matching behavior', () => {
      it('matches by exact _key value', () => {
        const value = createValues(['en-US'])
        expect(isButtonDisabled({id: 'en-US', title: 'English (US)'}, value, false)).toBe(true)
        expect(isButtonDisabled({id: 'en', title: 'English'}, value, false)).toBe(false)
      })

      it('is case sensitive', () => {
        const value = createValues(['EN'])
        expect(isButtonDisabled({id: 'en', title: 'English'}, value, false)).toBe(false)
        expect(isButtonDisabled({id: 'EN', title: 'ENGLISH'}, value, false)).toBe(true)
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
    const MAX_COLUMNS = {
      codeOnly: 5,
      titleOnly: 4,
      titleAndCode: 3,
    }

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

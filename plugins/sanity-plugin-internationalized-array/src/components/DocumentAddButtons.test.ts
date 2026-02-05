import {describe, expect, it} from 'vitest'

import {LANGUAGE_FIELD_NAME} from '../constants'
import {
  createInsertItem,
  filterAlreadyTranslated,
  getInitialValueForType,
} from '../utils/documentAddButtonsHelpers'

/**
 * Tests for components/DocumentAddButtons.tsx
 *
 * This file tests the utility functions used by the DocumentAddButtons component
 * for language identification using LANGUAGE_FIELD_NAME.
 * When migrating to sanity_language, these tests should catch breakages in:
 * - Filtering existing translations by LANGUAGE_FIELD_NAME
 * - Creating new items with LANGUAGE_FIELD_NAME set to language id
 *
 * Note: We test the extracted utility functions that the component uses.
 */

type TranslationDoc = {
  _key: string
  _type: string
  path: string[]
  pathString: string
}

describe('DocumentAddButtons', () => {
  describe('filterAlreadyTranslated - filtering existing translations', () => {
    it('filters documents with matching language field', () => {
      const translations: TranslationDoc[] = [
        {_key: 'en', _type: 'test', path: ['field1'], pathString: 'field1'},
        {_key: 'fr', _type: 'test', path: ['field1'], pathString: 'field1'},
        {_key: 'en', _type: 'test', path: ['field2'], pathString: 'field2'},
      ]

      const result = filterAlreadyTranslated(translations, 'en')
      expect(result).toHaveLength(2)
      expect(result.every((t) => t[LANGUAGE_FIELD_NAME] === 'en')).toBe(true)
    })

    it('returns empty array when no matches', () => {
      const translations: TranslationDoc[] = [
        {_key: 'en', _type: 'test', path: ['field1'], pathString: 'field1'},
        {_key: 'fr', _type: 'test', path: ['field1'], pathString: 'field1'},
      ]

      const result = filterAlreadyTranslated(translations, 'de')
      expect(result).toHaveLength(0)
    })

    it('is case sensitive when matching language field', () => {
      const translations: TranslationDoc[] = [
        {_key: 'EN', _type: 'test', path: ['field1'], pathString: 'field1'},
      ]

      const result = filterAlreadyTranslated(translations, 'en')
      expect(result).toHaveLength(0)
    })
  })

  describe('createInsertItem - creating insert patches', () => {
    it('creates item with language field set to language id', () => {
      const item = createInsertItem('en', 'internationalizedArrayStringValue', undefined)
      expect(item[LANGUAGE_FIELD_NAME]).toBe('en')
      expect(item['_type']).toBe('internationalizedArrayStringValue')
    })

    it('preserves initial value for array-based types', () => {
      const item = createInsertItem('en', 'internationalizedArrayBodyValue', [])
      expect(item[LANGUAGE_FIELD_NAME]).toBe('en')
      expect(item['value']).toEqual([])
    })

    it('handles language ids with special characters', () => {
      const item = createInsertItem('pt-BR', 'internationalizedArrayStringValue', undefined)
      expect(item[LANGUAGE_FIELD_NAME]).toBe('pt-BR')
    })
  })

  describe('getInitialValueForType - initial value determination', () => {
    it('returns empty array for body type', () => {
      const result = getInitialValueForType('internationalizedArrayBodyValue')
      expect(result).toEqual([])
    })

    it('returns empty array for blockContent type', () => {
      const result = getInitialValueForType('internationalizedArrayBlockContentValue')
      expect(result).toEqual([])
    })

    it('returns empty array for portableText type', () => {
      const result = getInitialValueForType('internationalizedArrayPortableTextValue')
      expect(result).toEqual([])
    })

    it('returns empty array for htmlContent type', () => {
      const result = getInitialValueForType('internationalizedArrayHtmlContentValue')
      expect(result).toEqual([])
    })

    it('returns undefined for string type', () => {
      const result = getInitialValueForType('internationalizedArrayStringValue')
      expect(result).toBeUndefined()
    })

    it('returns undefined for number type', () => {
      const result = getInitialValueForType('internationalizedArrayNumberValue')
      expect(result).toBeUndefined()
    })

    it('returns undefined for non-matching type names', () => {
      const result = getInitialValueForType('someOtherType')
      expect(result).toBeUndefined()
    })

    it('returns undefined for empty type name', () => {
      const result = getInitialValueForType('')
      expect(result).toBeUndefined()
    })
  })
})

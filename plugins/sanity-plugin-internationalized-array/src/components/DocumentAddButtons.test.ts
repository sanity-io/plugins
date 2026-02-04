import {describe, expect, it} from 'vitest'

/**
 * Tests for components/DocumentAddButtons.tsx
 *
 * This file tests the DocumentAddButtons component logic that uses _key for language identification.
 * When migrating to sanity_language, these tests should catch breakages in:
 * - Filtering existing translations by _key
 * - Creating new items with _key set to language id
 *
 * Note: The actual component uses React hooks and Sanity context which are
 * difficult to test in isolation. We test the underlying logic instead.
 */

type TranslationDoc = {
  _key: string
  _type: string
  path: string[]
  pathString: string
}

/**
 * From DocumentAddButtons.tsx:
 * const alreadyTranslated = documentsToTranslation.filter(
 *   (translation) => translation?._key === languageId,
 * )
 */
function filterAlreadyTranslated(
  translations: TranslationDoc[],
  languageId: string,
): TranslationDoc[] {
  return translations.filter((translation) => translation?._key === languageId)
}

/**
 * From DocumentAddButtons.tsx:
 * const removeDuplicates = documentsToTranslation.reduce<DocumentsToTranslate[]>(
 *   (filteredTranslations, translation) => {
 *     if (alreadyTranslated.filter(
 *       (alreadyTranslation) => alreadyTranslation.pathString === translation.pathString,
 *     ).length > 0) {
 *       return filteredTranslations
 *     }
 *     ...
 *   }
 * )
 */
function removeDuplicates(
  translations: TranslationDoc[],
  alreadyTranslated: TranslationDoc[],
): TranslationDoc[] {
  return translations.reduce<TranslationDoc[]>((filtered, translation) => {
    // Skip if already translated at this path
    if (alreadyTranslated.some((t) => t.pathString === translation.pathString)) {
      return filtered
    }
    // Skip if we already have this path in our filtered list
    if (filtered.some((t) => t.path === translation.path)) {
      return filtered
    }
    filtered.push(translation)
    return filtered
  }, [])
}

/**
 * From DocumentAddButtons.tsx:
 * const insertValue = insert(
 *   [{
 *     _key: languageId,  // <-- This is the key pattern
 *     _type: toTranslate._type,
 *     value: initialValue,
 *   }],
 *   'after',
 *   [...path, -1],
 * )
 */
function createInsertItem(languageId: string, _type: string, initialValue: unknown) {
  return {
    _key: languageId, // Language identifier stored in _key
    _type,
    value: initialValue,
  }
}

/**
 * From DocumentAddButtons.tsx:
 * const getInitialValueForType = useCallback((typeName: string): unknown => {
 *   // Check if it's a known array-based type (Portable Text fields)
 *   const arrayBasedTypes = new Set(['body', 'htmlContent', 'blockContent', 'portableText'])
 *   ...
 * })
 */
function getInitialValueForType(typeName: string): unknown {
  const match = typeName.match(/^internationalizedArray(.+)Value$/)
  if (!match || !match[1]) return undefined

  const baseTypeName = match[1].charAt(0).toLowerCase() + match[1].slice(1)
  const arrayBasedTypes = new Set(['body', 'htmlContent', 'blockContent', 'portableText'])

  if (arrayBasedTypes.has(baseTypeName)) {
    return []
  }
  return undefined
}

describe('DocumentAddButtons', () => {
  describe('filtering existing translations - uses _key comparison', () => {
    it('filters documents with matching _key', () => {
      const translations: TranslationDoc[] = [
        {_key: 'en', _type: 'test', path: ['field1'], pathString: 'field1'},
        {_key: 'fr', _type: 'test', path: ['field1'], pathString: 'field1'},
        {_key: 'en', _type: 'test', path: ['field2'], pathString: 'field2'},
      ]

      const result = filterAlreadyTranslated(translations, 'en')
      expect(result).toHaveLength(2)
      expect(result.every((t) => t._key === 'en')).toBe(true)
    })

    it('returns empty array when no matches', () => {
      const translations: TranslationDoc[] = [
        {_key: 'en', _type: 'test', path: ['field1'], pathString: 'field1'},
        {_key: 'fr', _type: 'test', path: ['field1'], pathString: 'field1'},
      ]

      const result = filterAlreadyTranslated(translations, 'de')
      expect(result).toHaveLength(0)
    })

    it('is case sensitive when matching _key', () => {
      const translations: TranslationDoc[] = [
        {_key: 'EN', _type: 'test', path: ['field1'], pathString: 'field1'},
      ]

      const result = filterAlreadyTranslated(translations, 'en')
      expect(result).toHaveLength(0)
    })
  })

  describe('removing duplicates - uses _key comparison', () => {
    it('excludes documents already translated', () => {
      const translations: TranslationDoc[] = [
        {_key: '', _type: 'test', path: ['field1'], pathString: 'field1'},
        {_key: '', _type: 'test', path: ['field2'], pathString: 'field2'},
      ]
      const alreadyTranslated: TranslationDoc[] = [
        {_key: 'en', _type: 'test', path: ['field1'], pathString: 'field1'},
      ]

      const result = removeDuplicates(translations, alreadyTranslated)
      expect(result).toHaveLength(1)
      expect(result[0]!.pathString).toBe('field2')
    })

    it('handles empty translations array', () => {
      const result = removeDuplicates([], [])
      expect(result).toHaveLength(0)
    })
  })

  describe('creating insert patches - uses _key for language', () => {
    it('creates item with _key set to language id', () => {
      const item = createInsertItem('en', 'internationalizedArrayStringValue', undefined)
      expect(item._key).toBe('en')
      expect(item._type).toBe('internationalizedArrayStringValue')
    })

    it('preserves initial value for array-based types', () => {
      const item = createInsertItem('en', 'internationalizedArrayBodyValue', [])
      expect(item._key).toBe('en')
      expect(item.value).toEqual([])
    })

    it('handles language ids with special characters', () => {
      const item = createInsertItem('pt-BR', 'internationalizedArrayStringValue', undefined)
      expect(item._key).toBe('pt-BR')
    })
  })

  describe('initial value determination', () => {
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
  })
})

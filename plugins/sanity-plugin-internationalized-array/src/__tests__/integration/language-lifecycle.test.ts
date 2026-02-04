import type {FormInsertPatch} from 'sanity'

import {describe, expect, it} from 'vitest'

import type {Language, Value} from '../../types'

import {checkAllLanguagesArePresent} from '../../utils/checkAllLanguagesArePresent'
import {createAddLanguagePatches} from '../../utils/createAddLanguagePatches'
import {createMockSchemaType, createValues, testLanguages} from '../test-utils'

// Helper to extract _key from patch items
function getItemKey(patch: FormInsertPatch): string {
  const item = patch.items[0]
  if (item && typeof item === 'object' && '_key' in item) {
    return item._key as string
  }
  throw new Error('Patch item missing _key')
}

/**
 * Integration tests for the language lifecycle
 *
 * These tests verify the complete flow of:
 * 1. Adding languages (creates items with _key as language id)
 * 2. Checking presence (uses _key to determine if language exists)
 * 3. Removing languages (preserves other items by _key)
 * 4. Reordering languages (maintains _key values)
 *
 * When migrating to sanity_language, ALL these patterns must be updated together.
 */

describe('language lifecycle integration', () => {
  const mockSchemaType = createMockSchemaType('internationalizedArrayString')

  describe('adding a language creates item with correct _key', () => {
    it('creates new item with _key set to language id', () => {
      const existingValue: Value[] = []

      // Step 1: Add a language
      const patches = createAddLanguagePatches({
        addLanguageKeys: ['en'],
        schemaType: mockSchemaType,
        languages: testLanguages,
        filteredLanguages: testLanguages,
        value: existingValue,
      })

      // Verify the new item has _key set to the language id
      expect(patches).toHaveLength(1)
      expect(getItemKey(patches[0]!)).toBe('en')

      // Simulate applying the patch
      const newValue: Value[] = [{_key: 'en', value: undefined}]

      // Step 2: Verify presence check finds the language via _key
      const isPresent = newValue.some((v) => v._key === 'en')
      expect(isPresent).toBe(true)
    })

    it('full add all missing languages flow', () => {
      // Start with just English
      const existingValue = createValues(['en'])

      // Add all missing languages
      const patches = createAddLanguagePatches({
        addLanguageKeys: [],
        schemaType: mockSchemaType,
        languages: testLanguages,
        filteredLanguages: testLanguages,
        value: existingValue,
      })

      // Should add fr, de, es (missing languages)
      expect(patches).toHaveLength(3)
      const addedKeys = patches.map(getItemKey)
      expect(addedKeys).toContain('fr')
      expect(addedKeys).toContain('de')
      expect(addedKeys).toContain('es')

      // Simulate the final state
      const finalValue = createValues(['en', 'fr', 'de', 'es'])

      // All languages should now be present
      expect(checkAllLanguagesArePresent(testLanguages, finalValue)).toBe(true)
    })
  })

  describe('removing a language preserves others', () => {
    it('other items maintain their _key values', () => {
      // Start with all languages
      const existingValue = createValues(['en', 'fr', 'de', 'es'])

      // Remove 'fr' by filtering it out
      const afterRemoval = existingValue.filter((v) => v._key !== 'fr')

      // Verify remaining items still have correct _keys
      expect(afterRemoval).toHaveLength(3)
      expect(afterRemoval.map((v) => v._key)).toEqual(['en', 'de', 'es'])

      // Adding 'fr' back should work
      const patches = createAddLanguagePatches({
        addLanguageKeys: ['fr'],
        schemaType: mockSchemaType,
        languages: testLanguages,
        filteredLanguages: testLanguages,
        value: afterRemoval,
      })

      expect(patches).toHaveLength(1)
      expect(getItemKey(patches[0]!)).toBe('fr')
    })
  })

  describe('reordering maintains _key values', () => {
    /**
     * This simulates the handleRestoreOrder logic from InternationalizedArray.tsx
     */
    it('reorders items to match language order while preserving _keys', () => {
      // Value is out of order
      const outOfOrderValue: Value[] = [
        {_key: 'es', value: 'Hola'},
        {_key: 'en', value: 'Hello'},
        {_key: 'fr', value: 'Bonjour'},
      ]

      // Reorder to match languages array
      const reordered = outOfOrderValue
        .reduce((acc, v) => {
          const newIndex = testLanguages.findIndex((l) => l.id === v._key)
          if (newIndex > -1) {
            acc[newIndex] = v
          }
          return acc
        }, [] as Value[])
        .filter(Boolean)

      // Items should now be in language order
      expect(reordered.map((v) => v._key)).toEqual(['en', 'fr', 'es'])

      // Values should be preserved
      expect(reordered.find((v) => v._key === 'en')?.value).toBe('Hello')
      expect(reordered.find((v) => v._key === 'fr')?.value).toBe('Bonjour')
      expect(reordered.find((v) => v._key === 'es')?.value).toBe('Hola')
    })

    it('strips invalid _keys during reorder', () => {
      const valueWithInvalid: Value[] = [
        {_key: 'en', value: 'Hello'},
        {_key: 'invalid', value: 'Bad'}, // Not a valid language
        {_key: 'fr', value: 'Bonjour'},
      ]

      const reordered = valueWithInvalid
        .reduce((acc, v) => {
          const newIndex = testLanguages.findIndex((l) => l.id === v._key)
          if (newIndex > -1) {
            acc[newIndex] = v
          }
          return acc
        }, [] as Value[])
        .filter(Boolean)

      // Invalid _key should be stripped
      expect(reordered).toHaveLength(2)
      expect(reordered.map((v) => v._key)).toEqual(['en', 'fr'])
    })
  })

  describe('language key validation integration', () => {
    it('verifies _key is used consistently across operations', () => {
      // This test documents the complete _key usage pattern

      // 1. Creating new items uses _key for language
      const patches = createAddLanguagePatches({
        addLanguageKeys: ['en'],
        schemaType: mockSchemaType,
        languages: testLanguages,
        filteredLanguages: testLanguages,
        value: [],
      })
      expect(getItemKey(patches[0]!)).toBe('en')

      // 2. Presence checking uses _key
      const value = createValues(['en', 'fr'])
      const hasEnglish = value.some((v) => v._key === 'en')
      expect(hasEnglish).toBe(true)

      // 3. Filtering uses _key
      const availableLanguages = testLanguages.filter(
        (lang) => !value.some((v) => v._key === lang.id),
      )
      expect(availableLanguages.map((l) => l.id)).toEqual(['de', 'es'])

      // 4. Duplicate detection uses _key
      const seenKeys = new Set<string>()
      const duplicates = value.filter((v) => {
        if (seenKeys.has(v._key)) return true
        seenKeys.add(v._key)
        return false
      })
      expect(duplicates).toHaveLength(0)

      // 5. Order comparison uses _key
      const languagesInUse = testLanguages.filter((l) => value.some((v) => v._key === l.id))
      expect(languagesInUse.map((l) => l.id)).toEqual(['en', 'fr'])
    })
  })

  describe('full workflow simulation', () => {
    it('simulates a complete document editing workflow', () => {
      const languages: Language[] = [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'},
        {id: 'de', title: 'German'},
      ]

      // 1. Start with empty field
      let value: Value[] = []
      expect(checkAllLanguagesArePresent(languages, value)).toBe(false)

      // 2. User adds English
      value = [{_key: 'en', value: 'Hello World'}]
      expect(value.some((v) => v._key === 'en')).toBe(true)
      expect(checkAllLanguagesArePresent(languages, value)).toBe(false)

      // 3. User adds French translation
      value = [...value, {_key: 'fr', value: 'Bonjour le monde'}]
      expect(value.some((v) => v._key === 'fr')).toBe(true)
      expect(checkAllLanguagesArePresent(languages, value)).toBe(false)

      // 4. User adds German translation
      value = [...value, {_key: 'de', value: 'Hallo Welt'}]
      expect(checkAllLanguagesArePresent(languages, value)).toBe(true)

      // 5. User removes French translation
      value = value.filter((v) => v._key !== 'fr')
      expect(checkAllLanguagesArePresent(languages, value)).toBe(false)
      expect(value.some((v) => v._key === 'fr')).toBe(false)

      // 6. English and German values are preserved
      expect(value.find((v) => v._key === 'en')?.value).toBe('Hello World')
      expect(value.find((v) => v._key === 'de')?.value).toBe('Hallo Welt')

      // 7. User can add French back
      const patches = createAddLanguagePatches({
        addLanguageKeys: ['fr'],
        schemaType: mockSchemaType,
        languages,
        filteredLanguages: languages,
        value,
      })
      expect(getItemKey(patches[0]!)).toBe('fr')
    })
  })
})

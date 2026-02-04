import type {FormInsertPatch} from 'sanity'

import {describe, expect, it} from 'vitest'

import type {Language} from '../types'

import {
  createMockSchemaType,
  createValues,
  testLanguages,
  twoLanguages,
} from '../__tests__/test-utils'
import {createAddLanguagePatches} from './createAddLanguagePatches'

// Helper to extract _key from patch items
function getItemKey(patch: FormInsertPatch): string {
  const item = patch.items[0]
  if (item && typeof item === 'object' && '_key' in item) {
    return item._key as string
  }
  throw new Error('Patch item missing _key')
}

// Helper to extract _type from patch items
function getItemType(patch: FormInsertPatch): string {
  const item = patch.items[0]
  if (item && typeof item === 'object' && '_type' in item) {
    return item._type as string
  }
  throw new Error('Patch item missing _type')
}

/**
 * Tests for utils/createAddLanguagePatches.ts
 *
 * This file tests the patch creation logic that uses _key as the language identifier.
 * When migrating to sanity_language, these tests should catch breakages in:
 * - New item creation with _key set to language.id
 * - Filtering languages already present (by comparing item._key to language.id)
 * - Insertion ordering based on language array position
 */

describe('createAddLanguagePatches', () => {
  const mockSchemaType = createMockSchemaType('internationalizedArrayString')

  describe('creates items with _key set to language id', () => {
    it('creates new item with _key matching language id', () => {
      const patches = createAddLanguagePatches({
        addLanguageKeys: ['en'],
        schemaType: mockSchemaType,
        languages: testLanguages,
        filteredLanguages: testLanguages,
        value: undefined,
      })

      expect(patches).toHaveLength(1)
      expect(patches[0]).toMatchObject({
        type: 'insert',
        items: [{_key: 'en', _type: 'internationalizedArrayStringValue'}],
      })
    })

    it('creates multiple items with correct _keys', () => {
      const patches = createAddLanguagePatches({
        addLanguageKeys: ['en', 'fr'],
        schemaType: mockSchemaType,
        languages: testLanguages,
        filteredLanguages: testLanguages,
        value: undefined,
      })

      expect(patches).toHaveLength(2)
      expect(getItemKey(patches[0]!)).toBe('en')
      expect(getItemKey(patches[1]!)).toBe('fr')
    })

    it('item _type is derived from schema type name', () => {
      const customSchemaType = createMockSchemaType('internationalizedArrayCustomField')

      const patches = createAddLanguagePatches({
        addLanguageKeys: ['en'],
        schemaType: customSchemaType,
        languages: testLanguages,
        filteredLanguages: testLanguages,
        value: undefined,
      })

      expect(getItemType(patches[0]!)).toBe('internationalizedArrayCustomFieldValue')
    })
  })

  describe('filters languages already in value - uses _key comparison', () => {
    it('excludes languages already present based on _key match', () => {
      // Value already has 'en' (identified by _key: 'en')
      const existingValue = createValues(['en'])

      const patches = createAddLanguagePatches({
        addLanguageKeys: [], // Empty means "add all missing"
        schemaType: mockSchemaType,
        languages: twoLanguages,
        filteredLanguages: twoLanguages,
        value: existingValue,
      })

      // Should only add 'fr' since 'en' is already present (matched by _key)
      expect(patches).toHaveLength(1)
      expect(getItemKey(patches[0]!)).toBe('fr')
    })

    it('does not add languages when all are present', () => {
      const existingValue = createValues(['en', 'fr'])

      const patches = createAddLanguagePatches({
        addLanguageKeys: [],
        schemaType: mockSchemaType,
        languages: twoLanguages,
        filteredLanguages: twoLanguages,
        value: existingValue,
      })

      expect(patches).toHaveLength(0)
    })

    it('specific addLanguageKeys bypasses filtering', () => {
      // Even if 'en' exists, explicitly adding it should create a patch
      // (though this would create a duplicate - validation handles that)
      const patches = createAddLanguagePatches({
        addLanguageKeys: ['de'],
        schemaType: mockSchemaType,
        languages: testLanguages,
        filteredLanguages: testLanguages,
        value: createValues(['en', 'fr']),
      })

      expect(patches).toHaveLength(1)
      expect(getItemKey(patches[0]!)).toBe('de')
    })
  })

  describe('calculates correct insertion index', () => {
    it('inserts at end when no later languages exist', () => {
      // Adding 'es' (last in language list) to array with 'en', 'fr'
      const existingValue = createValues(['en', 'fr'])

      const patches = createAddLanguagePatches({
        addLanguageKeys: ['es'],
        schemaType: mockSchemaType,
        languages: testLanguages, // ['en', 'fr', 'de', 'es']
        filteredLanguages: testLanguages,
        value: existingValue,
      })

      expect(patches[0]!).toMatchObject({
        type: 'insert',
        position: 'after',
      })
      // Path ends with -1 (insert at end)
      expect(patches[0]!.path[patches[0]!.path.length - 1]).toBe(-1)
    })

    it('inserts before next language in order', () => {
      // Adding 'de' to array with 'en', 'es'
      // 'de' should come before 'es' per language order
      const existingValue = createValues(['en', 'es'])

      const patches = createAddLanguagePatches({
        addLanguageKeys: ['de'],
        schemaType: mockSchemaType,
        languages: testLanguages, // ['en', 'fr', 'de', 'es']
        filteredLanguages: testLanguages,
        value: existingValue,
      })

      // 'de' should be inserted before 'es' (index 1)
      expect(patches[0]!).toMatchObject({
        type: 'insert',
        position: 'before',
      })
      // Path ends with 1 (insert before index 1)
      expect(patches[0]!.path[patches[0]!.path.length - 1]).toBe(1)
    })

    it('handles empty value array', () => {
      const patches = createAddLanguagePatches({
        addLanguageKeys: ['en'],
        schemaType: mockSchemaType,
        languages: testLanguages,
        filteredLanguages: testLanguages,
        value: [],
      })

      expect(patches).toHaveLength(1)
      expect(patches[0]!.position).toBe('after')
      // Path ends with -1 (insert at end)
      expect(patches[0]!.path[patches[0]!.path.length - 1]).toBe(-1)
    })

    it('handles undefined value', () => {
      const patches = createAddLanguagePatches({
        addLanguageKeys: ['en'],
        schemaType: mockSchemaType,
        languages: testLanguages,
        filteredLanguages: testLanguages,
        value: undefined,
      })

      expect(patches).toHaveLength(1)
    })
  })

  describe('maintains language order when inserting multiple', () => {
    it('inserts multiple languages in correct order', () => {
      // Adding 'fr' and 'de' to empty array
      const patches = createAddLanguagePatches({
        addLanguageKeys: ['fr', 'de'],
        schemaType: mockSchemaType,
        languages: testLanguages, // ['en', 'fr', 'de', 'es']
        filteredLanguages: testLanguages,
        value: [],
      })

      expect(patches).toHaveLength(2)
      // First 'fr', then 'de' - both at end initially, but local state tracking maintains order
      expect(getItemKey(patches[0]!)).toBe('fr')
      expect(getItemKey(patches[1]!)).toBe('de')
    })

    it('correctly orders when filling gaps', () => {
      // Value has 'en' and 'es', adding 'fr' and 'de' should maintain order
      const existingValue = createValues(['en', 'es'])

      const patches = createAddLanguagePatches({
        addLanguageKeys: [],
        schemaType: mockSchemaType,
        languages: testLanguages,
        filteredLanguages: testLanguages,
        value: existingValue,
      })

      expect(patches).toHaveLength(2)
      // 'fr' goes after 'en', 'de' goes before 'es'
      expect(getItemKey(patches[0]!)).toBe('fr')
      expect(getItemKey(patches[1]!)).toBe('de')
    })
  })

  describe('respects filteredLanguages', () => {
    it('only adds languages from filteredLanguages when addLanguageKeys is empty', () => {
      const filteredLanguages: Language[] = [
        {id: 'en', title: 'English'},
        {id: 'de', title: 'German'},
      ]

      const patches = createAddLanguagePatches({
        addLanguageKeys: [],
        schemaType: mockSchemaType,
        languages: testLanguages,
        filteredLanguages,
        value: [],
      })

      expect(patches).toHaveLength(2)
      expect(patches.map(getItemKey)).toEqual(['en', 'de'])
    })
  })

  describe('path support', () => {
    it('includes path in insert patches', () => {
      const patches = createAddLanguagePatches({
        addLanguageKeys: ['en'],
        schemaType: mockSchemaType,
        languages: testLanguages,
        filteredLanguages: testLanguages,
        value: undefined,
        path: ['myField'],
      })

      expect(patches[0]!.path).toContain('myField')
    })
  })
})

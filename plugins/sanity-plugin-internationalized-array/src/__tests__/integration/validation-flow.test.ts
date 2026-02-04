import {describe, expect, it, vi} from 'vitest'

import type {Language, Value} from '../../types'

import {getSelectedValue} from '../../components/getSelectedValue'
import createArraySchema from '../../schema/array'
import {getLanguagesFieldOption} from '../../utils/getLanguagesFieldOption'
import {createMockSchemaType, createValue, createValues, testLanguages} from '../test-utils'

/**
 * Integration tests for the validation flow
 *
 * These tests verify the complete validation logic that:
 * 1. Validates _key values against registered languages
 * 2. Detects duplicate _key values
 * 3. Generates error paths using _key
 *
 * When migrating to sanity_language, these validation patterns must all be updated.
 */

// Helper to run validation
async function runValidation(
  value: Value[] | undefined,
  options: {
    languages?: Language[]
    document?: Record<string, unknown>
    select?: Record<string, string>
  } = {},
) {
  const {languages = testLanguages, document = {}, select} = options

  const schema = createArraySchema({
    apiVersion: '2025-10-15',
    languages,
    select,
    type: 'string',
  })

  // Get the validation rule and extract the custom function
  const rule = (schema.validation as Function)({
    custom: (fn: (value: Value[], context: unknown) => Promise<unknown>) => ({_custom: fn}),
  })

  const mockContext = {
    document,
    type: createMockSchemaType('internationalizedArrayString', {
      languages,
      apiVersion: '2025-10-15',
      select,
    }),
    getClient: () => ({
      fetch: vi.fn().mockResolvedValue([]),
      config: () => ({apiVersion: '2025-10-15'}),
    }),
  }

  return (rule as {_custom: Function})._custom(value, mockContext)
}

describe('validation flow integration', () => {
  describe('validation error paths use _key', () => {
    it('validation error path references item by _key', async () => {
      const value = [
        createValue('en'),
        createValue('invalid-language'), // This _key is not a valid language
      ]

      const result = await runValidation(value)

      expect(result).toHaveProperty('paths')
      // The error path uses _key to identify the problematic item
      expect(result.paths).toEqual([[{_key: 'invalid-language'}]])
    })

    it('multiple errors each have _key-based paths', async () => {
      const value = [createValue('invalid1'), createValue('invalid2')]

      const result = await runValidation(value)

      expect(result).toHaveProperty('paths')
      expect(result.paths).toEqual([[{_key: 'invalid1'}], [{_key: 'invalid2'}]])
    })

    it('duplicate detection uses _key for error paths', async () => {
      const value = [
        createValue('en'),
        createValue('fr'),
        createValue('en'), // Duplicate _key
      ]

      const result = await runValidation(value)

      expect(result).toHaveProperty('message', 'There can only be one field per language')
      expect(result.paths).toEqual([[{_key: 'en'}]])
    })
  })

  describe('validation correctly identifies language by _key', () => {
    it('accepts items where _key matches a language id', async () => {
      const value = createValues(['en', 'fr'])
      const result = await runValidation(value)
      expect(result).toBe(true)
    })

    it('rejects items where _key does not match any language id', async () => {
      const value = [createValue('unknown')]
      const result = await runValidation(value)

      expect(result).toHaveProperty('message')
      expect(result.message).toContain('valid languages')
    })

    it('validates _key case sensitively', async () => {
      const value = [createValue('EN')] // uppercase
      const result = await runValidation(value) // languages have lowercase 'en'

      expect(result).toHaveProperty('message')
      expect(result.paths).toEqual([[{_key: 'EN'}]])
    })
  })

  describe('duplicate _key detection', () => {
    it('detects when same _key appears twice', async () => {
      const value = [
        createValue('en'),
        createValue('en'), // Duplicate
      ]

      const result = await runValidation(value)
      expect(result).toHaveProperty('message', 'There can only be one field per language')
    })

    it('allows different _keys', async () => {
      const value = [createValue('en'), createValue('fr'), createValue('de')]

      const result = await runValidation(value)
      expect(result).toBe(true)
    })

    it('reports all duplicate _keys, not just first', async () => {
      const value = [
        createValue('en'),
        createValue('en'), // First duplicate
        createValue('en'), // Second duplicate
      ]

      const result = await runValidation(value)
      expect(result.paths).toHaveLength(2) // Two duplicates
    })
  })

  describe('array length validation uses language count', () => {
    it('rejects arrays longer than language count', async () => {
      const twoLanguages: Language[] = [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'},
      ]

      const value = createValues(['en', 'fr', 'de']) // 3 items

      const result = await runValidation(value, {languages: twoLanguages})
      expect(result).toBe('Cannot be more than 2 items')
    })
  })

  describe('validation with dynamic languages', () => {
    it('validates against current language configuration', async () => {
      // Different language set
      const customLanguages: Language[] = [
        {id: 'ja', title: 'Japanese'},
        {id: 'ko', title: 'Korean'},
        {id: 'zh', title: 'Chinese'},
      ]

      // Valid with custom languages
      const validValue = createValues(['ja', 'ko'])
      const validResult = await runValidation(validValue, {languages: customLanguages})
      expect(validResult).toBe(true)

      // Invalid - 'en' is not in custom languages
      const invalidValue = [createValue('en')]
      const invalidResult = await runValidation(invalidValue, {languages: customLanguages})
      expect(invalidResult).toHaveProperty('message')
    })
  })

  describe('validation with document context', () => {
    it('uses getSelectedValue for dynamic language queries', () => {
      const select = {market: 'metadata.market'}
      const document = {
        metadata: {market: 'US'},
      }

      const selectedValue = getSelectedValue(select, document)
      expect(selectedValue).toEqual({market: 'US'})
    })

    it('getLanguagesFieldOption extracts languages from schema', () => {
      const schemaType = createMockSchemaType('test', {
        languages: testLanguages,
      })

      const languages = getLanguagesFieldOption(
        schemaType as Parameters<typeof getLanguagesFieldOption>[0],
      )
      expect(languages).toEqual(testLanguages)
    })
  })

  describe('edge cases in validation', () => {
    it('handles empty _key gracefully', async () => {
      // Empty _key passes the `item?._key` check (falsy, so skipped)
      // This is the "grace period" for items being created
      const value = [{_key: '', value: 'test'}]
      const result = await runValidation(value)

      // Empty string _key is skipped in validation due to falsy check
      // This matches the behavior for items without _key (grace period)
      expect(result).toBe(true)
    })

    it('handles undefined _key in single item', async () => {
      // Single item without _key is allowed (grace period for new items)
      const value = [{value: 'test'}] as Value[]
      const result = await runValidation(value)
      expect(result).toBe(true)
    })

    it('validates items with extra properties beyond _key', async () => {
      const value = [
        {_key: 'en', _type: 'internationalizedArrayStringValue', value: 'Hello'},
        {_key: 'fr', _type: 'internationalizedArrayStringValue', value: 'Bonjour'},
      ] as Value[]

      const result = await runValidation(value)
      expect(result).toBe(true)
    })
  })
})

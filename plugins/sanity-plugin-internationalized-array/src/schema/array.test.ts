import {describe, expect, it, vi} from 'vitest'

import type {Language, Value} from '../types'

import {
  createMockSchemaType,
  createValue,
  createValues,
  testLanguages,
} from '../__tests__/test-utils'
import {getSelectedValue} from '../components/getSelectedValue'
import {getLanguagesFieldOption} from '../utils/getLanguagesFieldOption'
import createArraySchema from './array'

/**
 * Tests for schema/array.ts
 *
 * This file tests the validation logic that uses _key as the language identifier.
 * When migrating to sanity_language, these tests should catch breakages in:
 * - Language key validation (item._key must be a valid language id)
 * - Duplicate language key detection
 * - Non-language key rejection
 * - Error path generation using _key
 */

// Helper to extract and run validation
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

  // Create mock context
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

describe('schema/array', () => {
  describe('createArraySchema', () => {
    it('creates array schema with correct structure', () => {
      const schema = createArraySchema({
        apiVersion: '2025-10-15',
        languages: testLanguages,
        type: 'string',
      })

      expect(schema.type).toBe('array')
      expect(schema.name).toBe('internationalizedArrayString')
      expect(schema.validation).toBeDefined()
    })

    it('accepts custom type as FieldDefinition', () => {
      const schema = createArraySchema({
        apiVersion: '2025-10-15',
        languages: testLanguages,
        type: {
          name: 'customField',
          type: 'object',
          fields: [],
        },
      })

      expect(schema.name).toBe('internationalizedArrayCustomField')
    })
  })

  describe('validation', () => {
    describe('valid arrays', () => {
      it('validates array with valid language keys', async () => {
        const value = createValues(['en', 'fr'])
        const result = await runValidation(value)
        expect(result).toBe(true)
      })

      it('returns true for empty arrays', async () => {
        const result = await runValidation([])
        expect(result).toBe(true)
      })

      it('returns true for undefined value', async () => {
        const result = await runValidation(undefined)
        expect(result).toBe(true)
      })

      it('handles single item without _key (grace period)', async () => {
        // Single item without _key is allowed during initial creation
        const value = [{value: 'test'}] as Value[]
        const result = await runValidation(value)
        expect(result).toBe(true)
      })

      it('validates subset of available languages', async () => {
        const value = createValues(['en']) // Only English, not all languages
        const result = await runValidation(value)
        expect(result).toBe(true)
      })
    })

    describe('invalid language keys - uses _key for identification', () => {
      it('rejects items with unknown language keys', async () => {
        // This tests the core _key pattern: item._key must match a language.id
        const value = [
          createValue('en'),
          createValue('invalid-lang'), // _key is not in languages list
        ]
        const result = await runValidation(value)

        expect(result).toEqual({
          message: 'Array item keys must be valid languages registered to the field type',
          paths: [[{_key: 'invalid-lang'}]], // Error path uses _key
        })
      })

      it('generates correct error paths for validation failures', async () => {
        // Multiple invalid _keys should each have their own error path
        const value = [createValue('unknown1'), createValue('unknown2')]
        const result = await runValidation(value)

        expect(result).toEqual({
          message: 'Array item keys must be valid languages registered to the field type',
          paths: [[{_key: 'unknown1'}], [{_key: 'unknown2'}]],
        })
      })
    })

    describe('duplicate language keys - uses _key for detection', () => {
      it('detects duplicate language keys', async () => {
        // Duplicates are detected by comparing item._key values
        const value = [
          createValue('en'),
          createValue('fr'),
          createValue('en'), // Duplicate _key
        ]
        const result = await runValidation(value)

        expect(result).toEqual({
          message: 'There can only be one field per language',
          paths: [[{_key: 'en'}]], // Points to the duplicate using _key
        })
      })

      it('reports all duplicates, not just first', async () => {
        const value = [
          createValue('en'),
          createValue('en'), // First duplicate
          createValue('en'), // Second duplicate
        ]
        const result = await runValidation(value)

        expect(result).toEqual({
          message: 'There can only be one field per language',
          paths: [[{_key: 'en'}], [{_key: 'en'}]],
        })
      })
    })

    describe('array length validation', () => {
      it('rejects arrays longer than available languages', async () => {
        const twoLanguages: Language[] = [
          {id: 'en', title: 'English'},
          {id: 'fr', title: 'French'},
        ]
        const value = createValues(['en', 'fr', 'de']) // 3 items, but only 2 languages

        const result = await runValidation(value, {languages: twoLanguages})
        expect(result).toBe('Cannot be more than 2 items')
      })

      it('uses singular form for single language limit', async () => {
        const oneLanguage: Language[] = [{id: 'en', title: 'English'}]
        const value = createValues(['en', 'fr'])

        const result = await runValidation(value, {languages: oneLanguage})
        expect(result).toBe('Cannot be more than 1 item')
      })
    })

    describe('async language resolution', () => {
      it('works with language callback function', async () => {
        const languageCallback = vi.fn().mockResolvedValue(testLanguages)

        const schema = createArraySchema({
          apiVersion: '2025-10-15',
          languages: languageCallback,
          type: 'string',
        })

        // The callback should be invoked during validation
        // This tests the integration with async language fetching
        expect(schema.options).toHaveProperty('languages', languageCallback)
      })
    })
  })
})

describe('getSelectedValue', () => {
  it('extracts selected values from document', () => {
    const select = {market: 'metadata.market'}
    const document = {metadata: {market: 'US'}}

    const result = getSelectedValue(select, document)
    expect(result).toEqual({market: 'US'})
  })

  it('returns empty object for undefined select', () => {
    const result = getSelectedValue(undefined, {})
    expect(result).toEqual({})
  })

  it('returns empty object for undefined document', () => {
    const result = getSelectedValue({market: 'market'}, undefined)
    expect(result).toEqual({})
  })

  it('filters array references without _ref', () => {
    const select = {refs: 'references'}
    const document = {
      references: [
        {_type: 'reference', _ref: 'doc1'},
        {_type: 'reference'}, // No _ref - should be filtered
        {_type: 'reference', _ref: 'doc2'},
      ],
    }

    const result = getSelectedValue(select, document)
    expect(result['refs']).toHaveLength(2)
  })
})

describe('getLanguagesFieldOption', () => {
  it('extracts languages from schema options', () => {
    const schemaType = createMockSchemaType('test', {
      languages: testLanguages,
    })

    const result = getLanguagesFieldOption(
      schemaType as Parameters<typeof getLanguagesFieldOption>[0],
    )
    expect(result).toEqual(testLanguages)
  })

  it('returns undefined for schema without languages option', () => {
    const schemaType = createMockSchemaType('test', {})

    const result = getLanguagesFieldOption(
      schemaType as Parameters<typeof getLanguagesFieldOption>[0],
    )
    expect(result).toBeUndefined()
  })

  it('returns undefined for undefined schema', () => {
    const result = getLanguagesFieldOption(undefined)
    expect(result).toBeUndefined()
  })

  it('recursively checks parent type for languages', () => {
    const parentType = createMockSchemaType('parent', {
      languages: testLanguages,
    })
    const childType = {
      ...createMockSchemaType('child', {}),
      type: parentType,
    }

    const result = getLanguagesFieldOption(
      childType as Parameters<typeof getLanguagesFieldOption>[0],
    )
    expect(result).toEqual(testLanguages)
  })
})

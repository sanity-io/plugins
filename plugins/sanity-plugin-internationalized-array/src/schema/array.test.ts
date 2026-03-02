import {describe, expect, test, vi} from 'vitest'

import {LANGUAGE_FIELD_NAME} from '../constants'
import {MOCK_LANGUAGES, createValue, createValues} from '../test/helpers'
import type {Language} from '../types'

// Mock the React component to avoid transitive import issues
// (InternationalizedArray imports from sanity/structure, @sanity/language-filter, etc.)
vi.mock('../components/InternationalizedArray', () => ({
  default: () => null,
}))

import arrayFactory from './array'

type ValidationResult = true | string | {message: string; paths: unknown[]}
type ValidationFn = (value: unknown, context: unknown) => Promise<ValidationResult>

/**
 * Extracts the async custom validation function from the schema definition
 * returned by the array factory.
 *
 * The factory returns `{ validation: (rule) => rule.custom(fn) }`.
 * We provide a mock Rule that captures `fn` so we can call it directly.
 */
function extractValidator(schemaDefinition: any): ValidationFn {
  let validator!: ValidationFn
  const mockRule = {
    custom: (fn: ValidationFn) => {
      validator = fn
      return mockRule
    },
  }
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  const validationSetup = schemaDefinition['validation'] as (rule: typeof mockRule) => void
  validationSetup(mockRule)
  return validator
}

/**
 * Creates a mock validation context with languages available via schema options.
 * The `getLanguagesFieldOption` utility reads from `context.type.options.languages`.
 */
function createMockValidationContext(languages: Language[]) {
  return {
    document: {},
    getClient: () => ({}),
    type: {
      options: {
        languages,
      },
    },
  }
}

describe('array schema factory', () => {
  const schema = arrayFactory({
    apiVersion: '2025-10-15',
    languages: MOCK_LANGUAGES,
    type: 'string',
  })

  test('generates correct array name from type', () => {
    expect(schema.name).toBe('internationalizedArrayString')
  })

  test('sets type to array', () => {
    expect(schema.type).toBe('array')
  })

  test('generates correct "of" type with value object name', () => {
    expect(schema.of).toHaveLength(1)
    expect(schema.of[0]!.name).toBe('internationalizedArrayStringValue')
  })

  test('stores languages in options for validation access', () => {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const options = schema.options as {languages: Language[]}
    expect(options.languages).toBe(MOCK_LANGUAGES)
  })

  test('handles FieldDefinition type input', () => {
    const fieldDefSchema = arrayFactory({
      apiVersion: '2025-10-15',
      languages: MOCK_LANGUAGES,
      type: {name: 'customType', type: 'string'},
    })
    expect(fieldDefSchema.name).toBe('internationalizedArrayCustomType')
  })

  describe('validation', () => {
    const validate = extractValidator(schema)
    const context = createMockValidationContext(MOCK_LANGUAGES)

    test('returns true for undefined value', async () => {
      expect(await validate(undefined, context)).toBe(true)
    })

    test('returns true for empty array', async () => {
      expect(await validate([], context)).toBe(true)
    })

    test('returns true for single item without a language identifier', async () => {
      // Simulates an item that has not yet been assigned a language.
      // When LANGUAGE_FIELD_NAME is '_key', _key must be falsy for the early return.
      // When LANGUAGE_FIELD_NAME is 'language', the language field is absent.
      const item: Record<string, unknown> = {_key: 'temp-key'}
      if (LANGUAGE_FIELD_NAME === '_key') {
        // Delete _key to be empty so the early return triggers
        delete item['_key']
      }
      expect(await validate([item], context)).toBe(true)
    })

    test('returns error message when value count exceeds language count (singular)', async () => {
      const singleLangContext = createMockValidationContext([MOCK_LANGUAGES[0]!])
      const value = createValues(['en', 'fr'])
      const result = await validate(value, singleLangContext)
      expect(result).toBe('Cannot be more than 1 item')
    })

    test('returns error message when value count exceeds language count (plural)', async () => {
      const twoLangContext = createMockValidationContext(MOCK_LANGUAGES.slice(0, 2))
      const value = createValues(['en', 'fr', 'es'])
      const result = await validate(value, twoLangContext)
      expect(result).toBe('Cannot be more than 2 items')
    })

    test('returns error with paths for invalid language keys', async () => {
      // 'xx' is not a registered language
      const value = [createValue('en'), createValue('xx')]
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const result = (await validate(value, context)) as {message: string; paths: unknown[]}
      expect(result.message).toBe(
        'Array item keys must be valid languages registered to the field type',
      )
      expect(result.paths).toHaveLength(1)
    })

    test('returns error with paths for duplicate language keys', async () => {
      const value = [createValue('en'), createValue('en')]
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const result = (await validate(value, context)) as {message: string; paths: unknown[]}
      expect(result.message).toBe('There can only be one field per language')
      expect(result.paths).toHaveLength(1)
    })

    test('returns true for valid unique language keys', async () => {
      const value = createValues(['en', 'fr', 'es'])
      expect(await validate(value, context)).toBe(true)
    })

    test('returns true when all languages are present', async () => {
      const value = createValues(['en', 'fr', 'es', 'de'])
      expect(await validate(value, context)).toBe(true)
    })

    test('resolves languages from async callback when not in cache', async () => {
      const asyncLanguages: Language[] = [{id: 'ja', title: 'Japanese'}]
      const callbackContext = {
        document: {},
        getClient: () => ({}),
        type: {
          options: {
            languages: async () => asyncLanguages,
          },
        },
      }
      const value = createValues(['ja'])
      // The callback returns ['ja'], and value has ['ja'] → valid
      expect(await validate(value, callbackContext)).toBe(true)
    })
  })
})

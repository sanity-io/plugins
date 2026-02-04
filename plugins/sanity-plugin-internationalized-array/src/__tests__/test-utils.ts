import type {Language, PluginConfig, Value} from '../types'

/**
 * Test utilities for sanity-plugin-internationalized-array
 *
 * These helpers create consistent test data for testing _key-based language identification,
 * which is the core pattern that will be migrated to sanity_language.
 */

// Common language fixtures
export const testLanguages: Language[] = [
  {id: 'en', title: 'English'},
  {id: 'fr', title: 'French'},
  {id: 'de', title: 'German'},
  {id: 'es', title: 'Spanish'},
]

export const twoLanguages: Language[] = [
  {id: 'en', title: 'English'},
  {id: 'fr', title: 'French'},
]

// Helper to create Value items with _key as language identifier
export function createValue(languageId: string, value?: unknown): Value {
  return {
    _key: languageId,
    value,
  }
}

// Helper to create an array of Values from language IDs
export function createValues(
  languageIds: string[],
  valueFactory?: (id: string) => unknown,
): Value[] {
  return languageIds.map((id) => createValue(id, valueFactory ? valueFactory(id) : undefined))
}

// Default plugin config for tests
export const defaultTestConfig: Required<PluginConfig> = {
  languages: testLanguages,
  select: {},
  defaultLanguages: [],
  fieldTypes: ['string'],
  apiVersion: '2025-10-15',
  buttonLocations: ['field'],
  buttonAddAll: true,
  languageDisplay: 'codeOnly',
}

// Mock SchemaType for testing
export function createMockSchemaType(name: string, options?: Record<string, unknown>) {
  return {
    name,
    title: name,
    type: undefined,
    options,
    jsonType: 'object' as const,
    fields: [],
  }
}

// Mock validation context
export function createMockValidationContext(options: {
  document?: Record<string, unknown>
  languages?: Language[]
}) {
  const {document = {}, languages = testLanguages} = options

  return {
    document,
    type: createMockSchemaType('internationalizedArrayString', {
      languages,
      apiVersion: '2025-10-15',
    }),
    getClient: () => ({
      fetch: async () => [],
      config: () => ({apiVersion: '2025-10-15'}),
    }),
  }
}

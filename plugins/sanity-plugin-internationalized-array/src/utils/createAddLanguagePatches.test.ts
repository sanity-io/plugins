import {describe, expect, test, vi} from 'vitest'

import {LANGUAGE_FIELD_NAME} from '../constants'
import {MOCK_LANGUAGES, createValue} from '../test/helpers'

// Mock sanity's insert function so we can inspect the arguments
vi.mock('sanity', () => ({
  insert: (items: unknown[], position: string, path: unknown[]) => ({
    type: 'insert',
    items,
    position,
    path,
  }),
}))

import {createAddLanguagePatches} from './createAddLanguagePatches'

type PatchType = {
  items: Record<string, unknown>[]
  position: string
  path: unknown[]
}

describe('createAddLanguagePatches', () => {
  const languages = MOCK_LANGUAGES // en, fr, es, de
  const filteredLanguages = MOCK_LANGUAGES
  const schemaTypeName = 'internationalizedArrayString'

  test('creates patches for specified addLanguageKeys', () => {
    const patches = createAddLanguagePatches({
      addLanguageKeys: ['en'],
      schemaTypeName,
      languages,
      filteredLanguages,
    })

    expect(patches).toHaveLength(1)
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const details = patches[0] as PatchType
    expect(details.items[0]![LANGUAGE_FIELD_NAME]).toBe('en')
    expect(details.items[0]!['_type']).toBe('internationalizedArrayStringValue')
  })

  test('creates patches for all filtered languages when addLanguageKeys is empty', () => {
    const patches = createAddLanguagePatches({
      addLanguageKeys: [],
      schemaTypeName,
      languages,
      filteredLanguages,
    })

    expect(patches).toHaveLength(4)
    const languageIds = patches.map(
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      (p) => (p as unknown as PatchType).items[0]![LANGUAGE_FIELD_NAME],
    )
    expect(languageIds).toEqual(['en', 'fr', 'es', 'de'])
  })

  test('skips languages already in value when addLanguageKeys is empty', () => {
    const value = [createValue('en'), createValue('fr')]
    const patches = createAddLanguagePatches({
      addLanguageKeys: [],
      schemaTypeName,
      languages,
      filteredLanguages,
      value,
    })

    expect(patches).toHaveLength(2)
    const languageIds = patches.map(
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      (p) => (p as unknown as PatchType).items[0]![LANGUAGE_FIELD_NAME],
    )
    expect(languageIds).toEqual(['es', 'de'])
  })

  test('inserts at end (after) when no subsequent language exists in value', () => {
    // Adding 'de' (last language) - nothing comes after it
    const patches = createAddLanguagePatches({
      addLanguageKeys: ['de'],
      schemaTypeName,
      languages,
      filteredLanguages,
    })

    expect(patches).toHaveLength(1)
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const details = patches[0] as PatchType
    expect(details.position).toBe('after')
  })

  test('inserts before next language when a subsequent language exists in value', () => {
    // Value has 'en' and 'de'. Adding 'fr'.
    // Languages order: [en, fr, es, de]
    // After 'fr' in language order: [es, de]. 'de' exists in value at index 1.
    // So 'fr' should insert before the position of 'de'.
    const value = [createValue('en'), createValue('de')]
    const patches = createAddLanguagePatches({
      addLanguageKeys: ['fr'],
      schemaTypeName,
      languages,
      filteredLanguages,
      value,
    })

    expect(patches).toHaveLength(1)
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const details = patches[0] as PatchType
    expect(details.position).toBe('before')
    expect(details.items[0]![LANGUAGE_FIELD_NAME]).toBe('fr')
  })

  test('handles adding multiple languages with correct ordering', () => {
    // Start with only 'en', add 'fr' and 'de'
    const value = [createValue('en')]
    const patches = createAddLanguagePatches({
      addLanguageKeys: ['fr', 'de'],
      schemaTypeName,
      languages,
      filteredLanguages,
      value,
    })

    expect(patches).toHaveLength(2)
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    expect((patches[0] as unknown as PatchType).items[0]![LANGUAGE_FIELD_NAME]).toBe('fr')
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    expect((patches[1] as unknown as PatchType).items[0]![LANGUAGE_FIELD_NAME]).toBe('de')
  })

  test('uses provided path for patch references', () => {
    const patches = createAddLanguagePatches({
      addLanguageKeys: ['en'],
      schemaTypeName,
      languages,
      filteredLanguages,
      path: ['content', 'title'],
    })

    expect(patches).toHaveLength(1)
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const details = patches[0] as PatchType
    // Path should start with the provided path segments
    expect(details.path[0]).toBe('content')
    expect(details.path[1]).toBe('title')
  })

  test('creates items with correct _type from schema', () => {
    const patches = createAddLanguagePatches({
      addLanguageKeys: ['en'],
      schemaTypeName: 'internationalizedArrayText',
      languages,
      filteredLanguages,
    })

    expect(patches).toHaveLength(1)
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const details = patches[0] as PatchType
    expect(details.items[0]!['_type']).toBe('internationalizedArrayTextValue')
  })

  test('only adds filtered languages that are missing when addLanguageKeys is empty', () => {
    // Only fr and es are in filteredLanguages
    const subsetFiltered = MOCK_LANGUAGES.slice(1, 3)
    const patches = createAddLanguagePatches({
      addLanguageKeys: [],
      schemaTypeName,
      languages,
      filteredLanguages: subsetFiltered,
    })

    expect(patches).toHaveLength(2)
    const languageIds = patches.map(
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      (p) => (p as unknown as PatchType).items[0]![LANGUAGE_FIELD_NAME],
    )
    expect(languageIds).toEqual(['fr', 'es'])
  })
})

import type {InternationalizedArrayContextProps} from '../components/InternationalizedArrayContext'
import {LANGUAGE_FIELD_NAME} from '../constants'
import type {Language, InternationalizedArrayItem} from '../types'

/**
 * Shared mock language definitions for tests.
 */
export const MOCK_LANGUAGES: Language[] = [
  {id: 'en', title: 'English'},
  {id: 'fr', title: 'French'},
  {id: 'es', title: 'Spanish'},
  {id: 'de', title: 'German'},
]

/**
 * Creates a mock internationalized array item with the language field set correctly.
 *
 * When LANGUAGE_FIELD_NAME is '_key', the _key is set to the languageId (current behavior).
 * When LANGUAGE_FIELD_NAME is 'language', _key is a separate unique identifier
 * and the language field holds the languageId (future behavior).
 */
export function createValue(
  languageId: string,
  opts?: {value?: unknown; type?: InternationalizedArrayItem['_type']},
): InternationalizedArrayItem {
  return {
    _type: opts?.type ?? 'internationalizedArrayStringValue',
    _key: `key-${languageId}`,
    [LANGUAGE_FIELD_NAME]: languageId,
    value: opts?.value,
  }
}

/**
 * Creates an array of mock internationalized array items.
 */
export function createValues(
  languageIds: string[],
  opts?: {type?: InternationalizedArrayItem['_type']; value?: unknown},
): InternationalizedArrayItem[] {
  return languageIds.map((id) => createValue(id, opts))
}

export const MOCK_INTERNATIONALIZED_ARRAY_CONTEXT: InternationalizedArrayContextProps = {
  languages: MOCK_LANGUAGES,
  filteredLanguages: MOCK_LANGUAGES,
  defaultLanguages: [],
  buttonAddAll: true,
  buttonLocations: ['field'],
  languageDisplay: 'codeOnly' as const,
  apiVersion: '2025-10-15',
  select: {},
  fieldTypes: [],
  includeForDocumentType: () => true,
}

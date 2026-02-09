import type {InternationalizedArrayContextProps} from '../components/InternationalizedArrayContext'
import type {Language, Value} from '../types'

import {LANGUAGE_FIELD_NAME} from '../constants'

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
  opts?: {value?: unknown; type?: string},
): Value & Record<string, unknown> {
  return {
    _type: opts?.type ?? 'internationalizedArrayStringValue',
    [LANGUAGE_FIELD_NAME]: languageId,
    ...(LANGUAGE_FIELD_NAME === '_key' ? {} : {_key: `key-${languageId}`}),
    value: opts?.value,
  } as Value & Record<string, unknown>
}

/**
 * Creates an array of mock internationalized array items.
 */
export function createValues(
  languageIds: string[],
  opts?: {type?: string},
): (Value & Record<string, unknown>)[] {
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
}

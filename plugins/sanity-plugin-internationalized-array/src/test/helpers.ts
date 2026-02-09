import {LANGUAGE_FIELD_NAME} from '../constants'
import type {Language, Value} from '../types'

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
    ...(LANGUAGE_FIELD_NAME === "_key" ? {} : {_key: `key-${languageId}`}),
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

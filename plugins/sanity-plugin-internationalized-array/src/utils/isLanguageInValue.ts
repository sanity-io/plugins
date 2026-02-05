import type {Language, Value} from '../types'

import {LANGUAGE_FIELD_NAME} from '../constants'

/**
 * Check if a specific language is already present in the value array.
 * Uses the LANGUAGE_FIELD_NAME constant (currently '_key') for identification.
 *
 * @param language - The language to check for
 * @param value - The array of values to search
 * @returns true if the language is found in the value array
 */
export function isLanguageInValue(language: Language, value: Value[] | undefined): boolean {
  return Boolean(value?.find((item) => item[LANGUAGE_FIELD_NAME] === language.id))
}

/**
 * Determine if an add button should be disabled for a given language.
 *
 * @param language - The language for the button
 * @param value - The current value array
 * @param readOnly - Whether the field is in read-only mode
 * @returns true if the button should be disabled
 */
export function isAddButtonDisabled(
  language: Language,
  value: Value[] | undefined,
  readOnly: boolean,
): boolean {
  return readOnly || isLanguageInValue(language, value)
}

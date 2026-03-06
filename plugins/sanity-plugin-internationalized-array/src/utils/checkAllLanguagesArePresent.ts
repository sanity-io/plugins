import {LANGUAGE_FIELD_NAME} from '../constants'
import type {Language, InternationalizedArrayItem} from '../types'

/**
 * Checks whether every language in the provided list has a corresponding entry
 * in the value array. It extracts language IDs from value items using
 * `LANGUAGE_FIELD_NAME` and compares them against the expected language IDs.
 *
 * Returns `true` only when the value array length matches the number of unique
 * languages and every value language ID is found in the languages list
 * (order does not matter). The length check ensures duplicates in value are
 * correctly rejected.
 */
export function checkAllLanguagesArePresent(
  languages: Language[],
  value: InternationalizedArrayItem[] | undefined,
): boolean {
  const filteredLanguageIds = new Set(languages.map((l) => l.id))
  const languagesInUseIds = value ? value.map((v) => v[LANGUAGE_FIELD_NAME]) : []

  if (languagesInUseIds.length !== filteredLanguageIds.size) return false
  if (new Set(languagesInUseIds).size !== languagesInUseIds.length) return false
  return languagesInUseIds.every((key) => filteredLanguageIds.has(key))
}

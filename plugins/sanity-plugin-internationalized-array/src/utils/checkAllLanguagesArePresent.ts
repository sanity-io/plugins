import type {Language, Value} from '../types'

import {LANGUAGE_FIELD_NAME} from '../constants'

/**
 * Checks whether every language in the provided list has a corresponding entry
 * in the value array. It extracts language IDs from value items using
 * `LANGUAGE_FIELD_NAME` and compares them against the expected language IDs.
 *
 * Returns `true` only when the counts match and every value language ID
 * is found in the languages list (order does not matter).
 */
export function checkAllLanguagesArePresent(
  languages: Language[],
  value: Value[] | undefined,
): boolean {
  const languageIdSet = new Set(languages.map((l) => l.id))
  const languagesInUseSet = new Set(value ? value.map((v) => v[LANGUAGE_FIELD_NAME]) : [])

  return languageIdSet.symmetricDifference(languagesInUseSet).size === 0
}

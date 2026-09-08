import {LANGUAGE_FIELD_NAME} from '../constants'
import type {Language, InternationalizedArrayItem} from '../types'

/**
 * Generates the label text for the "add all / add missing languages" button.
 *
 * - When there is no existing value: returns `"Add {title} Field"` for a
 *   single language, or `"Add all languages"` for multiple.
 * - When some values already exist: returns `"Add missing language"` (singular)
 *   or `"Add missing languages"` (plural) depending on how many are left.
 */
export function createAddAllTitle(
  value: InternationalizedArrayItem[] | undefined,
  languages: Language[],
): string {
  if (value?.length) {
    const languagesInUse = new Set(value.map((item) => item[LANGUAGE_FIELD_NAME]))
    const missingCount = languages.filter((language) => !languagesInUse.has(language.id)).length
    return `Add missing ${missingCount === 1 ? `language` : `languages`}`
  }

  return languages.length === 1 && languages[0]
    ? `Add ${languages[0].title} Field`
    : `Add all languages`
}

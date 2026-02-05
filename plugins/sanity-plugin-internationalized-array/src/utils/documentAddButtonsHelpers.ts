import {LANGUAGE_FIELD_NAME} from '../constants'

/**
 * Known array-based types (Portable Text fields) that should be initialized as empty arrays.
 */
export const ARRAY_BASED_TYPES = new Set(['body', 'htmlContent', 'blockContent', 'portableText'])

/**
 * Get the initial value for a given internationalized array type.
 * Array-based types (like Portable Text) are initialized with empty arrays,
 * while other types are initialized as undefined.
 *
 * This is the pure logic portion that doesn't require schema lookup.
 * For full schema-aware behavior, see the useCallback in DocumentAddButtons.
 *
 * @param typeName - The type name to check (e.g., 'internationalizedArrayBodyValue')
 * @returns Empty array for array-based types, undefined otherwise
 */
export function getInitialValueForType(typeName: string): unknown {
  if (!typeName) return undefined

  // Extract the base type name from internationalized array type
  // e.g., "internationalizedArrayBodyValue" -> "body"
  const match = typeName.match(/^internationalizedArray(.+)Value$/)
  if (!match || !match[1]) return undefined

  const baseTypeName = match[1].charAt(0).toLowerCase() + match[1].slice(1)

  // Check if it's a known array-based type (Portable Text fields)
  if (ARRAY_BASED_TYPES.has(baseTypeName)) {
    return []
  }

  return undefined
}

/**
 * Filter translations to find those matching a specific language ID.
 *
 * @param translations - Array of translation documents
 * @param languageId - The language ID to filter by
 * @returns Translations that match the language ID
 */
export function filterAlreadyTranslated<T extends Record<string, unknown>>(
  translations: T[],
  languageId: string,
): T[] {
  return translations.filter((translation) => translation?.[LANGUAGE_FIELD_NAME] === languageId)
}

/**
 * Create an insert item for a new translation.
 *
 * @param languageId - The language ID for the new item
 * @param _type - The type of the item
 * @param initialValue - The initial value for the item
 * @returns An object ready to be inserted
 */
export function createInsertItem(
  languageId: string,
  _type: string,
  initialValue: unknown,
): Record<string, unknown> {
  return {
    [LANGUAGE_FIELD_NAME]: languageId,
    _type,
    value: initialValue,
  }
}

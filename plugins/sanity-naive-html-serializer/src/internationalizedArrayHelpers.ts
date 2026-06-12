/*
 * Helpers for supporting both data formats of `sanity-plugin-internationalized-array`:
 * - v4 (legacy): the language id is stored in `_key`
 *   e.g. {_key: 'en', _type: 'internationalizedArrayStringValue', value: 'hello'}
 * - v5 (current): the language id is stored in a dedicated `language` field and `_key`
 *   holds a stable random key
 *   e.g. {_key: 'abc123', _type: 'internationalizedArrayStringValue', language: 'en', value: 'hello'}
 */

export const LANGUAGE_FIELD = 'language'

/*
 * Resolve the language id of an internationalized array item, regardless of whether
 * it uses the legacy `_key` format or the new `language` field format.
 */
export const getItemLanguage = (item: Record<string, any> | undefined | null): string | undefined =>
  item?.[LANGUAGE_FIELD] ?? item?._key

/*
 * Returns true if any item in the array uses the v5 `language` field format.
 */
export const usesLanguageField = (arr: Array<Record<string, any>> | undefined | null): boolean =>
  Array.isArray(arr) && arr.some((item) => item && LANGUAGE_FIELD in item)

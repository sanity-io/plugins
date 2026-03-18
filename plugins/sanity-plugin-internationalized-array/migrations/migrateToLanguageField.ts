import {defineMigration, set} from 'sanity/migrate'

/**
 * The property which will be used to store the language identifier from v5.
 */
const LANGUAGE_FIELD_NAME = 'language'
/**
 * The prefix of the internationalized array type name.
 * Internationalized arrays contain objects with `_type` starting with this prefix
 * and ending with `Value` (e.g. `internationalizedArrayStringValue`).
 */
const INTERNATIONALIZED_PREFIX = 'internationalizedArray'
/**
 * The suffix of the internationalized array value type name.
 */
const VALUE_SUFFIX = 'Value'

/**
 * Creates a migration that automatically finds all internationalized array
 * item objects and moves language identifiers from `_key` to the dedicated
 * `language` field, generating new random `_key` values.
 *
 * Detection is automatic: the `object` handler is called for every object in
 * every matching document. If the object has a `_type` matching
 * `internationalizedArray*Value` and is missing the `language` field, it is
 * migrated.
 */
export function migrateToLanguageField(documentTypes: string[]) {
  return defineMigration({
    title: 'Migrate internationalized array from _key to language',
    documentTypes,
    migrate: {
      object(node) {
        const type = node['_type']
        const language = node[LANGUAGE_FIELD_NAME]

        if (
          typeof type !== 'string' ||
          !type.startsWith(INTERNATIONALIZED_PREFIX) ||
          !type.endsWith(VALUE_SUFFIX)
        ) {
          return undefined
        }

        // Already migrated: has a language field.
        if (language && typeof language === 'string') {
          return undefined
        }

        // Needs migration: _key holds the language id.
        const oldKey = node['_key']
        if (typeof oldKey !== 'string' || oldKey.length === 0) {
          return undefined
        }

        return set({
          ...node,
          _key: undefined,
          [LANGUAGE_FIELD_NAME]: oldKey,
        })
      },
    },
  })
}

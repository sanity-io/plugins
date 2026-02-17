import {defineMigration, set} from 'sanity/migrate'

// Complete this with the document types you want to migrate.
// If you use @sanity/document-internationalization, include 'translation.metadata' so that
// the translations array on metadata documents is migrated.
const DOCUMENT_TYPES: string[] = ['internationalizedPost', 'translation.metadata'] // Example: ['post', 'page']

/**
 * The property which will be used to store the language identifier from v5
 */
const LANGUAGE_FIELD_NAME = 'language'
/**
 * The prefix of the internationalized array type name
 * Internationalized arrays contain object with `_type` starting with this prefix and ending with `Value`
 * Example: `internationalizedArrayStringValue`
 */
const INTERNATIONALIZED_PREFIX = 'internationalizedArray'
/**
 * The suffix of the internationalized array value type name
 */
const VALUE_SUFFIX = 'Value'

/**
 * Creates a migration that automatically finds all internationalized array
 * item objects and moves language identifiers from `_key` to the dedicated
 * `language` field, generating new random `_key` values.
 *
 * Detection is automatic: the `object` handler is called for every object
 * in every matching document. If the object has a `_type` matching
 * `internationalizedArray*Value` (e.g. `internationalizedArrayStringValue`)
 * and is missing the `language` field, it is migrated.
 *
 */
export default defineMigration({
  title: 'Migrate internationalized array from language to _key',
  documentTypes: DOCUMENT_TYPES,
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

      // Already migrated — doesn't have a language field
      if (!language || typeof language !== 'string') {
        return undefined
      }

      // Needs migration — _key holds the language id

      return set({
        ...node,
        _key: language,
        [LANGUAGE_FIELD_NAME]: undefined,
      })
    },
  },
})

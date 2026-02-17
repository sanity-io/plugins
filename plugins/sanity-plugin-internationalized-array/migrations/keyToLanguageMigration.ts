/**
 * This migration will migrate the internationalized array from v4 to v5
 * It will move the language identifier from `_key` to the dedicated `language` field
 * and generate new random `_key` values.
 *
 * To use it:
 * 1. Complete the DOCUMENT_TYPES variable with the document types you want to migrate
 * 2. Copy this file into your project's migrations folder for example: `./migrations/createKeyToLanguageMigration.ts`
 * 3. Update your groq queries to use the new `language` field instead of `_key`
 *    ```diff
 *    *[_type == "post"] {
 *    -  "title": title[_key == "en"][0].value
 *    +  "title": title[language == "en" || _key == "en"][0].value
 *    }
 *    ```
 * 3. Backup your data before running the migration:
 *    npx sanity@latest dataset export
 * 4. Run the migration with the following command:
 *    npx sanity migration run createKeyToLanguageMigration --dry-run
 *    npx sanity migration run createKeyToLanguageMigration
 * 5. After the migration is complete, you can delete this file.
 */

import {defineMigration, set} from 'sanity/migrate'

// Complete this with the document types you want to migrate.
// If you use @sanity/document-internationalization, include 'translation.metadata' so that
// the translations array on metadata documents is migrated.
const DOCUMENT_TYPES: string[] = ['post', 'page', 'translation.metadata'] // Example: ['post', 'page']

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
  title: 'Migrate internationalized array from _key to language',
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

      // Already migrated — has a language field
      if (language && typeof language === 'string') {
        return undefined
      }

      // Needs migration — _key holds the language id
      const oldKey = node['_key']
      if (typeof oldKey !== 'string' || oldKey.length === 0) {
        return undefined
      }

      return set({
        ...node,
        _key: undefined, // Sets as undefined, the server will generate a new random key
        [LANGUAGE_FIELD_NAME]: oldKey,
      })
    },
  },
})

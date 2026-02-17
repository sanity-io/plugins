import {defineMigration, set} from 'sanity/migrate'

const DOCUMENT_TYPES: string[] = ['internationalizedPost', 'translation.metadata'] // Example: ['post', 'page']

const LANGUAGE_FIELD_NAME = 'language'
const INTERNATIONALIZED_PREFIX = 'internationalizedArray'
const VALUE_SUFFIX = 'Value'

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

      return set({
        ...node,
        _key: language,
        [LANGUAGE_FIELD_NAME]: undefined,
      })
    },
  },
})

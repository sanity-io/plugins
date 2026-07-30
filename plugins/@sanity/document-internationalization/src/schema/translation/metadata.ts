import {TranslateIcon} from '@sanity/icons/Translate'
import {defineField, defineType, type DocumentDefinition, type FieldDefinition} from 'sanity'
import {LANGUAGE_FIELD_NAME} from 'sanity-plugin-internationalized-array'

import {METADATA_SCHEMA_NAME, TRANSLATIONS_ARRAY_NAME} from '../../constants'
import type {TranslationReference} from '../../types'

/**
 * Creates the `translation.metadata` document schema definition. This schema
 * type stores the array of translation references linking all language versions
 * of a document together, along with the allowed schema types and any custom
 * metadata fields provided by the plugin consumer. The document uses `liveEdit`
 * so changes are published immediately without drafts.
 */
export default (
  schemaTypes: string[],
  metadataFields: FieldDefinition[],
  omnisearchVisibility = true,
): DocumentDefinition =>
  defineType({
    type: 'document',
    name: METADATA_SCHEMA_NAME,
    title: 'Translation metadata',
    icon: TranslateIcon,
    liveEdit: true,
    __experimental_omnisearch_visibility: omnisearchVisibility,
    fields: [
      defineField({
        name: TRANSLATIONS_ARRAY_NAME,
        type: 'internationalizedArrayReference',
      }),
      defineField({
        name: 'schemaTypes',
        description:
          'Optional: Used to filter the reference fields above so all translations share the same types.',
        type: 'array',
        of: [{type: 'string'}],
        options: {list: schemaTypes},
        readOnly: ({value}) => Boolean(value),
      }),
      ...metadataFields,
    ],
    preview: {
      select: {
        translations: TRANSLATIONS_ARRAY_NAME,
        documentSchemaTypes: 'schemaTypes',
      },
      prepare(selection) {
        const {translations = [], documentSchemaTypes = []} = selection
        const title =
          translations.length === 1 ? `1 Translation` : `${translations.length} Translations`
        const languageKeys = translations.length
          ? translations
              .map((t: TranslationReference) => t[LANGUAGE_FIELD_NAME].toUpperCase())
              .join(', ')
          : ``
        const subtitle = [
          languageKeys ? `(${languageKeys})` : null,
          documentSchemaTypes?.length ? documentSchemaTypes.map((s: string) => s).join(`, `) : ``,
        ]
          .filter(Boolean)
          .join(` `)

        return {
          title,
          subtitle,
        }
      },
    },
  })

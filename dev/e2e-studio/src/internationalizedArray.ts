import {defineField, definePlugin, defineType} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

/**
 * Schema + plugin wiring for internationalized-array e2e coverage.
 * Kept separate from smokeTestDocument so plugin suites stay easy to scan.
 */
const i18nPostType = defineType({
  name: 'i18nPost',
  title: 'I18n Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'internationalizedArrayString',
    }),
  ],
})

export const internationalizedArrayExample = definePlugin(() => ({
  schema: {
    types: [i18nPostType],
    templates: (prev) => [
      ...prev,
      {
        id: 'i18nPost-out-of-order',
        title: 'I18n Post (out of order languages)',
        schemaType: 'i18nPost',
        // FR before EN so restoreOrder must patch on create — that is the
        // SAPP-2921 race against Studio's initial-value read-only lock.
        value: {
          title: [
            {
              _key: 'title-fr',
              _type: 'internationalizedArrayStringValue',
              language: 'fr',
              value: 'Bonjour',
            },
            {
              _key: 'title-en',
              _type: 'internationalizedArrayStringValue',
              language: 'en',
              value: 'Hello',
            },
          ],
        },
      },
    ],
  },
  plugins: [
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Spanish'},
        {id: 'fr', title: 'French'},
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string'],
      buttonLocations: ['field', 'document'],
      buttonAddAll: true,
      languageDisplay: 'codeOnly',
      languageFilter: {
        documentTypes: ['i18nPost'],
        defaultLanguages: ['en'],
      },
    }),
  ],
}))

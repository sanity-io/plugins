import {defineField, definePlugin, defineType} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

const languages = [
  {id: 'en', title: 'English'},
  {id: 'es', title: 'Spanish'},
  {id: 'fr', title: 'French'},
  {id: 'de', title: 'German'},
]

export function internationalizedArrayExample() {
  return definePlugin({
    name: 'internationalized-array-example',
    plugins: [
      internationalizedArray({
        languages,
        defaultLanguages: ['en'],
        fieldTypes: ['string', 'text'],
      }),
    ],
    schema: {
      types: [
        defineType({
          name: 'i18n-example',
          title: 'Internationalized Example',
          type: 'document',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'internationalizedArrayString',
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'internationalizedArrayText',
            }),
          ],
        }),
      ],
    },
  })()
}

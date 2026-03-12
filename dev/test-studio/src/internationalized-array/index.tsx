import {defineArrayMember, definePlugin, defineType, defineField} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

const internationalizedPost = defineType({
  type: 'document',
  name: 'internationalizedPost',
  title: 'Internationalized Post',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'internationalizedArrayString',
      options: {
        aiAssist: {
          translateAction: true,
        },
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'internationalizedArrayText',
      options: {
        aiAssist: {
          translateAction: true,
        },
      },
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      description: 'description',
    },
    prepare(selection) {
      const {title, description} = selection
      return {
        title: title?.[0]?.value || 'Untitled',
        subtitle: description?.[0]?.value || 'No description',
      }
    },
  },
})
const person = defineType({
  name: 'i18nArrayPerformanceTest',
  title: 'I18n Array Performance Test',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'age',
      title: 'Age',
      type: 'number',
    }),
    ...Array.from({length: 30}, (_, i) =>
      defineField({
        name: 'field_' + i,
        type: 'internationalizedArrayString',
      }),
    ),
  ],
})

const bodyContent = defineType({
  name: 'i18nArrayCircularBodyContent',
  title: 'I18n Array Circular Body Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'object',
      name: 'tabs',
      fields: [
        defineField({
          name: 'tabs',
          title: 'Tabs',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'tab',
              fields: [
                defineField({
                  name: 'body',
                  title: 'Body',
                  type: 'i18nArrayCircularBodyContent',
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})

const circularSchemaRepro = defineType({
  name: 'i18nArrayCircularSchemaRepro',
  title: 'I18n Array Circular Schema Repro',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'i18nArrayCircularBodyContent',
    }),
  ],
})

export const internationalizedArrayExample = definePlugin(() => ({
  schema: {types: [internationalizedPost, person, bodyContent, circularSchemaRepro]},
  plugins: [
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Spanish'},
        {id: 'fr', title: 'French'},
        {id: 'de', title: 'German'},
        {id: 'pt', title: 'Portuguese'},
        {id: 'it', title: 'Italian'},
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string', 'text'],
      buttonLocations: ['document', 'field'],
      languageFilter: {
        documentTypes: ['internationalizedPost', 'lesson'],
      },
    }),
  ],
}))

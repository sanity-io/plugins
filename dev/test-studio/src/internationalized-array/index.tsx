import {languageFilter} from '@sanity/language-filter'
import {definePlugin, defineType, defineField} from 'sanity'
import {
  internationalizedArray,
  isInternationalizedArrayItemType,
} from 'sanity-plugin-internationalized-array'

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

const SUPPORTED_LANGUAGES = [
  {id: 'en', title: 'English'},
  {id: 'es', title: 'Spanish'},
  {id: 'fr', title: 'French'},
  {id: 'de', title: 'German'},
  {id: 'pt', title: 'Portuguese'},
  {id: 'it', title: 'Italian'},
]

export const internationalizedArrayExample = definePlugin(() => ({
  schema: {types: [internationalizedPost, person]},
  plugins: [
    internationalizedArray({
      languages: SUPPORTED_LANGUAGES,
      defaultLanguages: [SUPPORTED_LANGUAGES[0].id],
      fieldTypes: ['string', 'text'],
      buttonLocations: ['document', 'field'],
    }),
    languageFilter({
      documentTypes: ['internationalizedPost', 'lesson'],
      supportedLanguages: SUPPORTED_LANGUAGES,
      filterField: (enclosingType, member, selectedLanguageIds, parentValue) => {
        // Filter internationalized arrays
        if (
          enclosingType.jsonType === 'object' &&
          isInternationalizedArrayItemType(enclosingType.name) &&
          'kind' in member
        ) {
          const language = typeof parentValue?.language === 'string' ? parentValue?.language : null
          return language ? selectedLanguageIds.includes(language) : false
        }
        return true
      },
    }),
  ],
}))

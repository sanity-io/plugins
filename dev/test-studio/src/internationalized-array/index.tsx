import {languageFilter} from '@sanity/language-filter'
import {definePlugin, defineType, defineField, isKeySegment} from 'sanity'
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
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'internationalizedArrayText',
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

export const internationalizedArrayExample = definePlugin(() => ({
  schema: {types: [internationalizedPost]},
  plugins: [
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Spanish'},
        {id: 'fr', title: 'French'},
        {id: 'de', title: 'German'},
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string', 'text'],
      buttonLocations: ['document', 'field'],
    }),
    languageFilter({
      documentTypes: ['internationalizedPost', 'lesson'],
      supportedLanguages: [
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Spanish'},
        {id: 'fr', title: 'French'},
      ],
      filterField: (enclosingType, member, selectedLanguageIds) => {
        // Filter internationalized arrays - follows readme example
        if (
          enclosingType.jsonType === 'object' &&
          enclosingType.name.startsWith('internationalizedArray') &&
          'kind' in member
        ) {
          // Get last two segments of the field's path
          const pathEnd = member.field.path.slice(-2)
          // If the second-last segment is a _key, and the last segment is `value`,
          // It's an internationalized array value
          // And the array _key is the language of the field
          const language =
            pathEnd[1] === 'value' && isKeySegment(pathEnd[0]) ? pathEnd[0]._key : null

          return language ? selectedLanguageIds.includes(language) : false
        }

        // Filter internationalized objects if you have them
        // `localeString` must be registered as a custom schema type
        if (enclosingType.jsonType === 'object' && enclosingType.name.startsWith('locale')) {
          return selectedLanguageIds.includes(member.name)
        }

        return true
      },
    }),
  ],
}))

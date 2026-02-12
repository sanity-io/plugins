import {
  useDeleteTranslationAction,
  documentInternationalization,
  useDuplicateWithTranslationsAction,
} from '@sanity/document-internationalization'
import {defineField, definePlugin, defineType} from 'sanity'

// Define a simple lesson schema type for testing document internationalization
const lessonType = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'text',
    }),
  ],
})

export const documentInternationalizationExample = definePlugin(() => ({
  schema: {
    types: [lessonType],
  },
  document: {
    actions: (prev, {schemaType}) => {
      if (['lesson'].includes(schemaType)) {
        return [...prev, useDeleteTranslationAction, useDuplicateWithTranslationsAction]
      }

      return prev
    },
  },
  plugins: [
    documentInternationalization({
      supportedLanguages: [
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Spanish'},
        {id: 'fr', title: 'French'},
      ],
      schemaTypes: ['lesson'],
      bulkPublish: true,
    }),
  ],
}))

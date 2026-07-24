import {
  documentInternationalization,
  useDeleteTranslationAction,
  useDuplicateWithTranslationsAction,
} from '@sanity/document-internationalization'
import {defineField, definePlugin, defineType} from 'sanity'

/**
 * Schema + plugin wiring for document-internationalization e2e coverage.
 * Kept separate from smokeTestDocument so plugin suites stay easy to scan.
 */
export const lessonType = defineType({
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
      options: {
        documentInternationalization: {
          exclude: true,
        },
      },
    }),
  ],
})

export const documentInternationalizationExample = definePlugin(() => ({
  schema: {
    types: [lessonType],
  },
  document: {
    actions: (prev, {schemaType}) => {
      if (schemaType === 'lesson') {
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
      allowCreateMetaDoc: true,
      metadataInternationalization: {
        languageDisplay: 'titleAndCode',
      },
    }),
  ],
}))

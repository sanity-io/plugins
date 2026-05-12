import {
  useDeleteTranslationAction,
  documentInternationalization,
  useDuplicateWithTranslationsAction,
} from '@sanity/document-internationalization'
import {defineField, definePlugin, defineType} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

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

// --- Per-document-type language filter demo (issue #570) -------------------
//
// Two document types share the same shared `supportedLanguages` /
// `languages` lists, but they use the parallel filter options on each plugin
// to render different language sets in the UI:
//
//   - `lfDemoRecipe` is restricted to en + it on BOTH the document-level
//     Translations menu (`documentInternationalization.languageFilter`) AND
//     the field-level "Add language" buttons on the body field
//     (`internationalizedArray.filterLanguages`).
//   - `lfDemoLesson` has no filter, so all six languages render in both
//     places.
//
// To exercise the demo:
//   1. Open the `kitchen-sink` workspace.
//   2. Create a new "Recipe (#570 demo)" document. Click "Translations" in
//      the toolbar — only English and Italian appear. The Localized title
//      field's add-language buttons should show only EN and IT too.
//   3. Create a new "Lesson (#570 demo)" document. The Translations menu
//      and the add-language buttons both show all six languages.

const SHARED_LANGUAGES = [
  {id: 'en', title: 'English'},
  {id: 'es', title: 'Spanish'},
  {id: 'fr', title: 'French'},
  {id: 'de', title: 'German'},
  {id: 'it', title: 'Italian'},
  {id: 'pt', title: 'Portuguese'},
]

const RECIPE_LANGUAGES = new Set(['en', 'it'])

const lfDemoRecipe = defineType({
  name: 'lfDemoRecipe',
  title: 'Recipe (#570 demo)',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title (document)', type: 'string'}),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'localizedTitle',
      title: 'Localized title (field — also restricted)',
      type: 'internationalizedArrayString',
    }),
  ],
})

const lfDemoLesson = defineType({
  name: 'lfDemoLesson',
  title: 'Lesson (#570 demo, no filter)',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title (document)', type: 'string'}),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'localizedTitle',
      title: 'Localized title (field — all languages)',
      type: 'internationalizedArrayString',
    }),
  ],
})

export const documentInternationalizationExample = definePlugin(() => ({
  schema: {
    types: [lessonType, lfDemoRecipe, lfDemoLesson],
  },
  document: {
    actions: (prev, {schemaType}) => {
      if (['lesson', 'lfDemoRecipe', 'lfDemoLesson'].includes(schemaType)) {
        return [...prev, useDeleteTranslationAction, useDuplicateWithTranslationsAction]
      }

      return prev
    },
  },
  plugins: [
    documentInternationalization({
      supportedLanguages: SHARED_LANGUAGES,
      schemaTypes: ['lesson', 'lfDemoRecipe', 'lfDemoLesson'],
      bulkPublish: true,
      metadataInternationalization: {
        languageDisplay: 'titleAndCode',
      },
      // Document-level menu filter (issue #570)
      languageFilter: ({schemaType, defaultLanguages}) => {
        if (schemaType === 'lfDemoRecipe') {
          return defaultLanguages.filter((l) => RECIPE_LANGUAGES.has(l.id))
        }
        return defaultLanguages
      },
    }),
    // The lessonType example above doesn't use internationalizedArray.
    // For the #570 demo we add a separate internationalizedArray instance
    // configured for the demo doc types and exercising filterLanguages.
    internationalizedArray({
      languages: SHARED_LANGUAGES,
      fieldTypes: ['string'],
      buttonLocations: ['field'],
      includeForDocumentType: (documentType) =>
        ['lfDemoRecipe', 'lfDemoLesson'].includes(documentType),
      // Field-level button filter (issue #570 follow-up — applies to the
      // sanity-plugin-internationalized-array half).
      filterLanguages: ({schemaType, defaultLanguages}) => {
        if (schemaType === 'lfDemoRecipe') {
          return defaultLanguages.filter((l) => RECIPE_LANGUAGES.has(l.id))
        }
        return defaultLanguages
      },
    }),
  ],
}))

import {assist} from '@sanity/assist'
import {defineArrayMember, defineField, definePlugin, defineType} from 'sanity'

// Fixture for manually testing AI Assist together with field groups (tabs).
// Reproduces SAPP-3970: opening / editing AI Assist instructions used to reset
// the selected field group in the host document.
const assistFieldGroupsRepro = defineType({
  name: 'assistFieldGroupsRepro',
  title: 'AI Assist: Field groups',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', group: 'content'}),
    defineField({name: 'body', title: 'Body', type: 'text', group: 'content'}),
    defineField({name: 'metaTitle', title: 'Meta title', type: 'string', group: 'seo'}),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      group: 'seo',
    }),
  ],
})

// Fixture for manually testing `assist.maxFieldSelectionDepth` (sanity-io/plugins#1992).
// `hours[_key].hoursOfOperation.temporaryHours[_key].reason.en` is 7 path segments deep, so with
// the default depth of 6 the locale strings under `reason` get no AI Assist field action and are
// missing from the field picker, while `reason` itself (depth 6) has both.
const assistLocaleString = defineType({
  name: 'assistLocaleString',
  title: 'Locale string',
  type: 'object',
  fields: [
    defineField({name: 'en', title: 'English', type: 'string'}),
    defineField({name: 'fr', title: 'French', type: 'string'}),
  ],
})

const assistTemporaryHours = defineType({
  name: 'assistTemporaryHours',
  title: 'Temporary hours',
  type: 'object',
  fields: [
    defineField({name: 'date', title: 'Date', type: 'date'}),
    defineField({name: 'reason', title: 'Reason', type: 'assistLocaleString'}),
  ],
})

const assistHoursOfOperation = defineType({
  name: 'assistHoursOfOperation',
  title: 'Hours of operation',
  type: 'object',
  fields: [
    defineField({
      name: 'temporaryHours',
      title: 'Temporary hours',
      type: 'array',
      of: [defineArrayMember({type: 'assistTemporaryHours'})],
    }),
  ],
})

const assistOverviewHours = defineType({
  name: 'assistOverviewHours',
  title: 'Overview hours',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'assistLocaleString'}),
    defineField({
      name: 'hoursOfOperation',
      title: 'Hours of operation',
      type: 'assistHoursOfOperation',
    }),
  ],
})

const assistDeepNestingRepro = defineType({
  name: 'assistDeepNestingRepro',
  title: 'AI Assist: Deeply nested fields',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({
      name: 'hours',
      title: 'Hours',
      type: 'array',
      of: [defineArrayMember({type: 'assistOverviewHours'})],
    }),
  ],
})

export const assistExample = definePlugin(() => ({
  schema: {
    types: [
      assistFieldGroupsRepro,
      assistLocaleString,
      assistTemporaryHours,
      assistHoursOfOperation,
      assistOverviewHours,
      assistDeepNestingRepro,
    ],
  },
  plugins: [
    assist({
      assist: {
        // Raised from the default of 6 so the depth-7 locale strings in
        // `assistDeepNestingRepro` get AI Assist too
        maxFieldSelectionDepth: 8,
      },
      translate: {
        document: {
          languageField: 'language',
          documentTypes: ['lesson'],
        },
        field: {
          documentTypes: ['internationalizedPost'],
          languages: [
            {id: 'en', title: 'English'},
            {id: 'es', title: 'Spanish'},
            {id: 'fr', title: 'French'},
            {id: 'de', title: 'German'},
            {id: 'pt', title: 'Portuguese'},
            {id: 'it', title: 'Italian'},
          ],
        },
      },
    }),
  ],
}))

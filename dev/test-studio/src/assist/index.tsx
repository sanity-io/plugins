import {assist} from '@sanity/assist'
import {defineField, definePlugin, defineType} from 'sanity'

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

export const assistExample = definePlugin(() => ({
  schema: {
    types: [assistFieldGroupsRepro],
  },
  plugins: [
    assist({
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

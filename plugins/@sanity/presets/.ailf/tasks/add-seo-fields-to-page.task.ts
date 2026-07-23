import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'add-seo-fields-to-page',
  title: 'Add SEO metadata to a page',
  area: 'studio-presets',
  context: {
    docs: [
      {
        path: 'studio/studio-plugins',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/add-seo-fields-to-page.reference.ts',
  prompt: {
    text: `Search engines and social share cards need proper metadata on our page documents. Add fields for a search title, a meta description, and an Open Graph image that appears when the page is shared on social media. Group these fields together so editors can find them in one place.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Website',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'page',
        title: 'Page',
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
            type: 'text',
          }),
        ],
      }),
    ],
  },
})
\`\`\``,
  },
  assertions: [
    {
      type: 'llm-rubric',
      template: 'task-completion',
      criteria: [
        {
          id: 'has-seo-title',
          text: 'The `page` document type has a field for a search engine title (e.g. `seoTitle`, `metaTitle`, or similar).',
        },
        {
          id: 'has-seo-description',
          text: 'The `page` document type has a field for a meta description.',
        },
        {
          id: 'has-og-image',
          text: 'The `page` document type has an image field for the Open Graph (social share) image.',
        },
        {
          id: 'seo-fields-grouped',
          text: 'The SEO-related fields are grouped or nested together (e.g. under an object field or a field group), rather than added as three separate top-level fields.',
        },
        {
          id: 'exports-studio-configuration',
          text: 'Exports a valid Studio configuration.',
        },
      ],
    },
    {
      type: 'llm-rubric',
      template: 'code-correctness',
      criteria: [
        {
          id: 'uses-define-seo-preset',
          text: 'The SEO metadata is produced using a `defineSeo` function obtained from a `createPresetsRegistry()` call, rather than three separate hand-rolled fields (title string, description text, ogImage image) defined individually.',
        },
      ],
    },
  ],
})

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
    text: `Our pages need to look right when they are shared on social media and when they turn up in search results. Give editors control over that, kept together in one place so they can find it.

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
          text: 'The `page` type carries a search engine title. A `defineSeo(...)` call from `@sanity/presets` satisfies this, since it produces a `title` field; a hand-rolled solution declares a string field for it (`seoTitle`, `metaTitle`, or similar).',
        },
        {
          id: 'has-seo-description',
          text: 'The `page` type carries a meta description. A `defineSeo(...)` call satisfies this, since it produces a `description` field; a hand-rolled solution declares a field for it.',
        },
        {
          id: 'has-og-image',
          text: 'The `page` type carries an Open Graph image for social shares. A `defineSeo(...)` call satisfies this, since it produces an `ogImage` field; a hand-rolled solution declares an `image` field for it.',
        },
        {
          id: 'seo-fields-grouped',
          text: 'The metadata sits inside a single field on `page`, such as a `defineSeo(...)` call or a hand-rolled object field, rather than three separate top-level fields.',
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
          text: 'The metadata field is produced by a `defineSeo` function obtained from a `createPresetsRegistry()` call, rather than a hand-rolled object composing a title, a description, and an image.',
        },
      ],
    },
  ],
})

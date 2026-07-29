import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'configure-editorial-image',
  title: 'Configure an editorial image with crop control and caption',
  area: 'studio-presets',
  context: {
    docs: [
      {
        path: 'studio/studio-plugins',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/configure-editorial-image.reference.ts',
  prompt: {
    text: `Our cover images run at a range of sizes across the site, and on narrow screens the important part of the picture keeps getting cut out. An accessibility audit also flagged that these images give screen readers nothing to work with, and the editorial team occasionally wants a short line of text under the image. Sort out the cover image on articles.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Editorial',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'article',
        title: 'Article',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'coverImage',
            title: 'Cover image',
            type: 'image',
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
          id: 'has-hotspot',
          text: 'The `article.coverImage` field lets editors choose the crop focus. A hand-rolled field sets `options: {hotspot: true}`; a `defineImage(...)` call from `@sanity/presets` satisfies this too, since hotspot is on unless `hotspot: false` is passed.',
        },
        {
          id: 'has-alt-text',
          text: 'The `article.coverImage` field carries a description for screen readers. A hand-rolled field declares an alt text field in its `fields` array; a `defineImage(...)` call satisfies this too, since it produces an `altText` field unless `altText: false` is passed.',
        },
        {
          id: 'has-caption',
          text: 'The `article.coverImage` field carries a caption. A hand-rolled field declares a caption field in its `fields` array; a `defineImage(...)` call satisfies this too, since it produces a `caption` field unless `caption: false` is passed.',
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
          id: 'uses-define-image-preset',
          text: 'The `coverImage` field is produced by a `defineImage` function obtained from a `createPresetsRegistry()` call, rather than a hand-rolled `defineField({type: "image", options: {hotspot: true}, fields: [...]})` with alt text and caption added manually.',
        },
      ],
    },
  ],
})

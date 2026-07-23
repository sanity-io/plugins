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
    text: `Our editorial images render at different sizes across the site and get cropped badly on smaller screens. Editors need to control the crop focus, add alternative text for accessibility, and optionally provide a caption shown below the image. Replace the existing plain image field on articles with one that supports all of this.

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
          text: 'The `article.coverImage` field has hotspot crop control enabled.',
        },
        {
          id: 'has-alt-text',
          text: 'The `article.coverImage` field has an alternative text field for accessibility.',
        },
        {
          id: 'has-caption',
          text: 'The `article.coverImage` field has a caption field.',
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
          text: 'The `coverImage` field is produced using a `defineImage` function obtained from a `createPresetsRegistry()` call, rather than a hand-rolled `defineField({type: "image", options: {hotspot: true}, fields: [...]})` with alt text and caption added manually.',
        },
      ],
    },
  ],
})

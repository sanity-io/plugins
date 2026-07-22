import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'create-studio-with-page-preset',
  title: 'Create Studio with page preset',
  area: 'studio-presets',
  context: {
    docs: [
      {
        path: 'studio/studio-plugins',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/create-studio-with-page-preset.reference.ts',
  prompt: {
    text: `Add a page document type to this Studio using the page-type preset from @sanity/presets.

Editors should be able to create page documents with a page builder, slug, and SEO metadata fields.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'My Studio',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [],
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
          id: 'includes-page-document-type',
          text: 'The Studio configuration includes a `page` document type produced by the `page-type` preset from `@sanity/presets`.',
        },
        {
          id: 'uses-create-presets-registry',
          text: 'The configuration uses `createPresetsRegistry` from `@sanity/presets` to instantiate the preset registry and obtain the `definePage` function.',
        },
        {
          id: 'page-type-added-to-schema',
          text: 'The `page` document type is included in the `schema.types` array passed to `defineConfig`.',
        },
        {
          id: 'exports-studio-configuration',
          text: 'Exports a valid Studio configuration.',
        },
      ],
    },
  ],
})

import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'compose-full-landing-page',
  title: 'Compose a full landing page schema',
  area: 'studio-presets',
  context: {
    docs: [
      {
        path: 'studio/studio-plugins',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/compose-full-landing-page.reference.ts',
  prompt: {
    text: `We need a landing page schema for our marketing site. Editors build pages by composing sections: a hero with a headline and a call-to-action button, rich text content blocks, and image blocks with captions. Pages need a URL slug and search-engine metadata.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Marketing site',
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
          id: 'has-page-document',
          text: 'The schema includes a `page` document type (or similarly named landing page document).',
        },
        {
          id: 'page-composes-sections',
          text: 'The page composes hero sections (with a heading and a CTA), rich text content blocks, and image blocks with captions as page builder sections.',
        },
        {
          id: 'page-has-slug',
          text: 'The page has a URL slug field.',
        },
        {
          id: 'page-has-seo-metadata',
          text: 'The page has SEO metadata fields (title, description, and/or Open Graph image).',
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
          id: 'uses-presets-registry',
          text: 'Uses a `createPresetsRegistry()` call to instantiate at least `definePage`, `defineCta`, `defineRichText`, and `defineImage`, rather than hand-rolling these content patterns from scratch.',
        },
        {
          id: 'composes-blocks-via-page-builder',
          text: 'Page sections are composed via the `pageBuilderBlocks` option on `definePage` (referencing block type names or inline preset instances), not by manually constructing an array field.',
        },
        {
          id: 'slug-and-seo-from-preset',
          text: "The slug and SEO metadata come from `definePage`'s built-in behaviour — they are not added as separate hand-rolled fields alongside the preset.",
        },
        {
          id: 'hero-is-hand-rolled',
          text: "The hero section is defined by hand using `defineType({type: 'object', ...})` — the hero is a custom type specific to this project, not a built-in preset.",
        },
        {
          id: 'no-hand-rolled-portable-text-or-cta',
          text: 'The solution does NOT hand-roll Portable Text, CTA schemas, or image handling that the presets already provide.',
        },
      ],
    },
  ],
})

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
    text: `We are modelling the landing pages for our marketing site. Editors assemble each page from sections: a hero at the top with a headline and a button that links somewhere, blocks of formatted copy, and images with a short line of text underneath. Every page needs a tidy URL, and needs to look right when it is shared on social media or turns up in search results.

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
          text: 'The schema includes a landing page document type, whether a `definePage(...)` call or a hand-rolled `defineType({type: "document", ...})`.',
        },
        {
          id: 'page-composes-sections',
          text: 'The page sections live in an array whose members cover a hero, formatted copy, and images. The members are named either in `pageBuilderBlocks` on `definePage` or in the `of` array of a hand-rolled field.',
        },
        {
          id: 'page-has-slug',
          text: 'The page has a slug. A `definePage(...)` call satisfies this, since it produces a `slug` field sourced from `name`; a hand-rolled page declares a field of type `slug`.',
        },
        {
          id: 'page-has-seo-metadata',
          text: 'The page carries search and social metadata. A `definePage(...)` call satisfies this, since it composes the SEO preset, as does a `defineSeo(...)` call; a hand-rolled page declares the title, description, and Open Graph image fields itself.',
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
          text: "Slug and SEO come from `definePage`'s built-in behaviour. They are not added as separate hand-rolled fields alongside the preset.",
        },
        {
          id: 'hero-is-hand-rolled',
          text: "The hero section is defined by hand using `defineType({type: 'object', ...})`. The hero is a custom type specific to this project, not a built-in preset.",
        },
        {
          id: 'no-hand-rolled-portable-text',
          text: 'Portable Text is provided by `defineRichText`, not hand-rolled as an `array` of `block` types with manual annotations.',
        },
        {
          id: 'no-hand-rolled-cta',
          text: "The hero's button is provided by `defineCta`, not hand-rolled as an object composing a link and an importance level.",
        },
        {
          id: 'no-hand-rolled-image-handling',
          text: "Image blocks are provided by `defineImage`, not hand-rolled as an object type wrapping `type: 'image'` with alt/caption fields.",
        },
      ],
    },
  ],
})

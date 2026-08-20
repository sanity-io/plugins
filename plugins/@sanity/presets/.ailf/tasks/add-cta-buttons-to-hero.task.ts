import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'add-cta-buttons-to-hero',
  title: 'Add CTA buttons to a hero section',
  area: 'studio-presets',
  context: {
    docs: [
      {
        path: 'studio/studio-plugins',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/add-cta-buttons-to-hero.reference.ts',
  prompt: {
    text: `Add repeatable link actions to the landing page hero. These will be shown in a button/action style on the website.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Marketing',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'landingPage',
        title: 'Landing Page',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'hero',
            title: 'Hero',
            type: 'object',
            fields: [
              defineField({
                name: 'heading',
                title: 'Heading',
                type: 'string',
              }),
            ],
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
          id: 'hero-has-ctas-array',
          text: 'The `hero` object gains an `array` field, so editors can add more than one action.',
        },
        {
          id: 'cta-has-link',
          text: 'Each array member carries a link destination. A `defineCta(...)` or `defineLink(...)` call from `@sanity/presets` satisfies this, since both produce an internal reference field and an external URL field. A hand-rolled member declares those destination fields itself.',
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
          id: 'uses-define-cta-preset',
          text: 'The array members are produced by a `defineCta` function obtained from a `createPresetsRegistry()` call, rather than a hand-rolled object type composing a link and an importance level.',
        },
        {
          id: 'uses-define-link-via-registry',
          text: 'Internal link targets are declared through a `to` option, either `link: {to: [...]}` on `createPresetsRegistry` or `to: [...]` on a `defineLink` call, rather than a manually constructed `reference` field.',
        },
      ],
    },
  ],
})

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
    text: `Our marketing team wants to add call-to-action buttons to the hero section of landing pages. Each CTA has a button label, a destination link, and a semantic importance level (primary vs secondary). Editors need to pick whether the link is to another document in the Studio or to an external URL. The hero should support multiple CTAs.

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
          text: 'The `hero` object has a `ctas` array field (or similarly named collection of CTAs).',
        },
        {
          id: 'cta-has-label',
          text: 'Each CTA item includes a label or title field for the button text.',
        },
        {
          id: 'cta-has-link',
          text: 'Each CTA item includes a link field that supports both internal (document reference) and external (URL) destinations.',
        },
        {
          id: 'cta-has-importance',
          text: 'Each CTA item includes a field for semantic importance (e.g. primary vs secondary, or a numeric level).',
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
          text: 'The CTA items in the array are produced using a `defineCta` function obtained from a `createPresetsRegistry()` call, rather than hand-rolled object types with separate label, link, and level fields.',
        },
        {
          id: 'uses-define-link-via-registry',
          text: 'Internal link targets are declared via the `to` option on the registry (e.g. `link: {to: [...]}` in `createPresetsRegistry`) or on a `defineLink` call, rather than constructing a reference field manually.',
        },
      ],
    },
  ],
})

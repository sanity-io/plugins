import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'link-to-multiple-document-types',
  title: 'Link a menu item to internal or external destinations',
  area: 'studio-presets',
  context: {
    docs: [
      {
        path: 'studio/studio-plugins',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/link-to-multiple-document-types.reference.ts',
  prompt: {
    text: `Our navigation menu items should be able to link to either a page or a blog post inside the Studio, or to an external URL. Editors need a single link field that handles all three cases, showing the right inputs depending on which destination type they choose.

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
          defineField({name: 'title', title: 'Title', type: 'string'}),
        ],
      }),
      defineType({
        name: 'post',
        title: 'Post',
        type: 'document',
        fields: [
          defineField({name: 'title', title: 'Title', type: 'string'}),
        ],
      }),
      defineType({
        name: 'menuItem',
        title: 'Menu Item',
        type: 'document',
        fields: [
          defineField({
            name: 'label',
            title: 'Label',
            type: 'string',
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
          id: 'has-link-field',
          text: 'The `menuItem` document type has a link field.',
        },
        {
          id: 'supports-page-and-post',
          text: 'The link field can point to both `page` and `post` document types as internal destinations.',
        },
        {
          id: 'supports-external-url',
          text: 'The link field also supports linking to an external URL.',
        },
        {
          id: 'conditional-inputs',
          text: 'The link field shows different inputs depending on the destination type chosen (e.g. a reference picker for internal, a URL field for external).',
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
          id: 'uses-define-link-preset',
          text: 'The link field is produced using a `defineLink` function obtained from a `createPresetsRegistry()` call, rather than a hand-rolled object type with manual `hidden` callbacks for conditional visibility.',
        },
        {
          id: 'internal-targets-via-registry-to',
          text: 'The allowed internal document types (`page` and `post`) are declared via a `to` option — either on the registry (`link: {to: ["page", "post"]}` in `createPresetsRegistry`) or on the `defineLink` call directly — rather than added as separate reference fields.',
        },
      ],
    },
  ],
})

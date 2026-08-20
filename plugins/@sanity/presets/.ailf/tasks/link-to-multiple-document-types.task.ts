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
    text: `Our navigation menu items need to point at pages and blog posts in the Studio, or out to a URL somewhere else. Editors pick the destination per menu item.

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
          text: 'The `menuItem` document type gains a field for the destination.',
        },
        {
          id: 'supports-page-and-post',
          text: 'Both `page` and `post` are declared as internal destinations, whether as `link: {to: ["page", "post"]}` on `createPresetsRegistry`, a `to: [...]` option on a `defineLink(...)` call, or `to: [{type: "page"}, {type: "post"}]` on a hand-rolled `reference` field.',
        },
        {
          id: 'supports-external-url',
          text: 'The destination can also be an external URL. A `defineLink(...)` call from `@sanity/presets` satisfies this, since it produces a `url` field; a hand-rolled solution declares a field of type `url`.',
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
          text: 'The destination field is produced by a `defineLink` function obtained from a `createPresetsRegistry()` call, rather than a hand-rolled object type composing an internal reference and an external URL field.',
        },
        {
          id: 'internal-targets-via-registry-to',
          text: 'The allowed internal document types are declared through a `to` option, either `link: {to: ["page", "post"]}` on `createPresetsRegistry` or `to: [...]` on the `defineLink` call, rather than as separate reference fields.',
        },
      ],
    },
  ],
})

import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'extend-page-with-category',
  title: 'Extend a page document with a campaign category',
  area: 'studio-presets',
  context: {
    docs: [
      {
        path: 'studio/studio-plugins',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/extend-page-with-category.reference.ts',
  prompt: {
    text: `Our marketing team wants to organise pages by campaign. Each page should belong to one campaign category, chosen from Spring, Summer, Autumn, or Winter. Editors also need to see the campaign in the document list, alongside the page title.

This is the existing Studio configuration:

\`\`\`ts
import {createPresetsRegistry} from '@sanity/presets'
import {defineConfig} from 'sanity'

const {definePage} = createPresetsRegistry()

export default defineConfig({
  name: 'default',
  title: 'Marketing site',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      definePage({
        name: 'page',
        title: 'Page',
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
          id: 'page-has-campaign-field',
          text: 'A `campaign` field (or similarly named) of type `string` is declared with an `options.list` holding exactly Spring, Summer, Autumn, and Winter. Passing it through the `fields` option on `definePage` counts, as does declaring it on a hand-rolled type.',
        },
        {
          id: 'preview-shows-campaign',
          text: 'The page type configures a preview whose `select` names `campaign` alongside the title field, whether through a `map.preview` hook, a `preview` option on the `definePage` call, or a `preview` on a hand-rolled type.',
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
          id: 'preserves-define-page',
          text: "The `definePage` invocation is preserved. The solution does NOT replace the page with a hand-rolled `defineType({name: 'page', type: 'document', fields: [...]})` that abandons the preset.",
        },
        {
          id: 'extends-via-fields-option',
          text: 'The campaign field is added via the `fields` option on the `definePage` call (or via a `map.fields` hook), not by wrapping or reconstructing the entire type.',
        },
      ],
    },
  ],
})

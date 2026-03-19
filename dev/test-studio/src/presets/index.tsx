import {linkType, LINK_TYPE_NAME, presets, pageType} from '@sanity/presets'
import {definePlugin, defineType, defineField} from 'sanity'

const corePresetsTest = defineType({
  name: 'corePresetsTest',
  type: 'document',
  title: 'Core Presets Test',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'link',
      title: 'Link',
      type: LINK_TYPE_NAME,
    },
  ],
})

export const presetsWorkspace = definePlugin(() => ({
  plugins: [
    presets(
      linkType({
        internalTypes: ['core.presets.page'],
      }),
      pageType({
        pageBuilderBlocks: ['core.presets.cta', 'blockquote'],
      }),
    ),
  ],
  schema: {
    types: [
      corePresetsTest,
      defineType({
        name: 'blockquote',
        title: 'Blockquote',
        type: 'object',
        fields: [
          defineField({
            name: 'quote',
            type: 'text',
          }),
        ],
      }),
    ],
  },
}))

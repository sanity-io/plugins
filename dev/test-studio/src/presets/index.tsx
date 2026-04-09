import {
  CTA_TYPE_NAME,
  ctaType,
  LINK_TYPE_NAME,
  linkType,
  PAGE_TYPE_NAME,
  pageType,
  presets,
  SEO_TYPE_NAME,
} from '@sanity/presets'
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
    {
      name: 'seo',
      title: 'SEO',
      type: SEO_TYPE_NAME,
    },
    {
      name: 'cta',
      title: 'CTA',
      type: CTA_TYPE_NAME,
    },
  ],
})

export const presetsWorkspace = definePlugin(() => ({
  plugins: [
    presets(
      linkType({
        internalTypes: [PAGE_TYPE_NAME],
      }),
      ctaType(),
      pageType({
        pageBuilderBlocks: ['blockquote'],
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

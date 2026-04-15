import {createPresetsRegistry} from '@sanity/presets'
import {definePlugin, defineType, defineField, type SchemaTypeDefinition} from 'sanity'

const {defineLink, defineCta, defineSeo, defineImage, definePage} = createPresetsRegistry({
  link: {
    internalTypes: ['marketingPage'],
  },
})

export const presetsWorkspace = definePlugin(() => ({
  schema: {
    types: [
      defineType({
        name: 'corePresetsTest',
        type: 'document',
        title: 'Core Presets Test',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          // oxlint-disable-next-line no-unsafe-type-assertion -- preset returns SchemaTypeDefinition used as inline field
          defineLink({name: 'link', title: 'Link'}) as never,
          // oxlint-disable-next-line no-unsafe-type-assertion -- preset returns SchemaTypeDefinition used as inline field
          defineSeo({name: 'seo', title: 'SEO'}) as never,
          // oxlint-disable-next-line no-unsafe-type-assertion -- preset returns SchemaTypeDefinition used as inline field
          defineCta({name: 'cta', title: 'CTA'}) as never,
          // oxlint-disable-next-line no-unsafe-type-assertion -- preset returns SchemaTypeDefinition used as inline field
          defineImage({name: 'featuredImage', title: 'Featured image'}) as never,
        ],
      }),
      definePage({
        name: 'marketingPage',
        title: 'Marketing Page',
        pageBuilderBlocks: ['blockquote'],
      }),
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
    ] as SchemaTypeDefinition[],
  },
}))

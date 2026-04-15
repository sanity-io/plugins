import {createPresetsRegistry} from '@sanity/presets'
import {definePlugin, defineType, defineField} from 'sanity'

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
          defineLink({name: 'link', title: 'Link'}),
          defineSeo({name: 'seo', title: 'SEO'}),
          defineCta({name: 'cta', title: 'CTA'}),
          defineImage({name: 'featuredImage', title: 'Featured image'}),
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
    ],
  },
}))

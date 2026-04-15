import {createPresetsRegistry} from '@sanity/presets'
import {definePlugin, defineType, defineField} from 'sanity'

const registry = createPresetsRegistry({
  link: {
    internalTypes: ['marketingPage'],
  },
})

const defineLink = registry['defineLink']
const defineCta = registry['defineCta']
const defineSeo = registry['defineSeo']
const defineImage = registry['defineImage']
const definePage = registry['definePage']

export const presetsWorkspace = definePlugin(() => ({
  schema: {
    types: [
      defineLink({name: 'presetsLink', title: 'Link'}),
      defineSeo({name: 'presetsSeo', title: 'SEO'}),
      defineCta({name: 'presetsCta', title: 'CTA'}),
      defineImage({name: 'presetsImage', title: 'Image'}),
      definePage({
        name: 'marketingPage',
        title: 'Marketing Page',
        pageBuilderBlocks: ['blockquote'],
      }),
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
          defineField({
            name: 'link',
            title: 'Link',
            type: 'presetsLink',
          }),
          defineField({
            name: 'seo',
            title: 'SEO',
            type: 'presetsSeo',
          }),
          defineField({
            name: 'cta',
            title: 'CTA',
            type: 'presetsCta',
          }),
          defineField({
            name: 'featuredImage',
            title: 'Featured image',
            type: 'presetsImage',
          }),
        ],
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

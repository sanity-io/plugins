import {createPresetsRegistry, definePresetType} from '@sanity/presets'
import {definePlugin, defineType, defineField} from 'sanity'

const customPreset = definePresetType<{}, 'object'>((context) => {
  return {
    name: 'custom',
    identifier: 'custom.preset',
    schemaType: defineType({
      name: 'custom',
      ...context,
      type: 'object',
      fields: [
        defineField({
          name: 'test',
          type: 'string',
        }),
      ],
    }),
  }
})

const {defineLink, defineCta, defineSeo, defineImage, definePage, defineCustom} =
  createPresetsRegistry({
    link: {
      internalTypes: ['marketingPage'],
    },
    extensions: [customPreset],
  })

export const presetsWorkspace = definePlugin(() => ({
  schema: {
    types: [
      // defineLink({name: 'presetsLink', title: 'Link'}),
      // defineSeo({name: 'presetsSeo', title: 'SEO'}),
      // defineCta({name: 'presetsCta', title: 'CTA'}),
      defineImage({name: 'presetsImage', title: 'Image'}),
      definePage({
        name: 'marketingPage',
        title: 'Marketing Page',
        pageBuilderBlocks: ['blockquote'],
        fields: [
          defineField({
            name: 'appended1',
            type: 'string',
            group: 'main',
          }),
          defineCustom({
            name: 'myCustom',
            title: 'My Custom',
            group: 'main',
          }),
        ],
        map: {
          fields: (fields = []) => [
            defineField({name: 'appended2', type: 'string', group: 'main'}),
            ...fields,
          ],
        },
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
          // defineField({
          //   name: 'link',
          //   title: 'Link',
          //   type: 'presetsLink',
          // }),
          // defineField({
          //   name: 'seo',
          //   title: 'SEO',
          //   type: 'presetsSeo',
          // }),
          // defineField({
          //   name: 'cta',
          //   title: 'CTA',
          //   type: 'presetsCta',
          // }),
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

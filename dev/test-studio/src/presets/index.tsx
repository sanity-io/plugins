import {createPresetsRegistry, definePresetType} from '@sanity/presets'
import {definePlugin, defineType, defineField} from 'sanity'

const customPreset = definePresetType<{}, 'object'>((config) => {
  const {fields, ...objectConfig} = config

  return {
    name: 'custom',
    identifier: 'custom.preset',
    schemaType: defineType({
      name: 'custom',
      ...objectConfig,
      type: 'object',
      fields: [
        defineField({
          name: 'test',
          type: 'string',
        }),
        ...(fields ?? []),
      ],
    }),
  }
})

const {defineImage, definePage, defineCustom} = createPresetsRegistry({
  link: {
    internalTypes: ['marketingPage'],
  },
  extensions: [customPreset],
})

export const presetsWorkspace = definePlugin(() => ({
  schema: {
    types: [
      defineCustom({name: 'presetsCustom', title: 'My Custom'}),
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
          defineField({
            name: 'myCustom',
            title: 'My Custom',
            type: 'presetsCustom',
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

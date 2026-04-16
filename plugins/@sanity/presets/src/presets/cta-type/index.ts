import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

export const ctaType = definePresetType<{}, 'object'>((context) => {
  const {fields, ...objectConfig} = context

  const linkField = Object.assign(
    defineField({name: 'link', title: 'Link', type: 'object', fields: []}),
    context.getPreset('link', {name: 'link', title: 'Link'}),
  )

  return {
    name: 'cta',
    identifier: 'core.presets.cta',
    schemaType: defineType({
      name: 'cta',
      title: 'Call to action',
      ...objectConfig,
      type: 'object',
      fields: [
        linkField,
        defineField({
          name: 'level',
          title: 'Level',
          type: 'number',
          options: {
            layout: 'radio',
            list: [1, 2, 3],
          },
        }),
        ...(fields ?? []),
      ],
    }),
  }
})

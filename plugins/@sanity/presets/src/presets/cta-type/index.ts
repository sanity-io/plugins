import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

export const ctaType = definePresetType<{}, 'object'>({
  name: 'cta',
  identifier: 'core.cta',
  schemaType: (config, registry) => {
    const {fields, ...objectConfig} = config

    return defineType({
      title: 'Call to action',
      ...objectConfig,
      type: 'object',
      fields: [
        registry.getPreset('link', {name: 'link', title: 'Link'}),
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
    })
  },
})

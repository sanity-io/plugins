import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

export const ctaType = definePresetType<{}, 'object'>((config, {getPreset}) => {
  const {fields, ...objectConfig} = config

  const linkField = getPreset('link', {name: 'link', title: 'Link'})

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

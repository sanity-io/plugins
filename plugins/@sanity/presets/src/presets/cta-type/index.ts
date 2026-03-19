import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'
import {LINK_TYPE_NAME, linkType} from '../link-type'

export const ctaType = definePresetType(() => {
  return {
    composes: [linkType],
    schemaType: defineType({
      name: 'core.presets.cta',
      type: 'object',
      title: 'Call to action',
      fields: [
        defineField({
          name: 'link',
          title: 'Link',
          type: LINK_TYPE_NAME,
        }),
        defineField({
          name: 'level',
          title: 'Level',
          type: 'number',
          options: {
            layout: 'radio',
            list: [1, 2, 3],
          },
        }),
      ],
    }),
  }
})

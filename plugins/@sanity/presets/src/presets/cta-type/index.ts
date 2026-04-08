import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'
import {LINK_TYPE_NAME, linkType} from '../link-type'
import {CTA_TYPE_NAME} from './constants'

export {CTA_TYPE_NAME} from './constants'

export const ctaType = definePresetType(() => {
  return {
    composes: [linkType],
    schemaType: defineType({
      name: CTA_TYPE_NAME,
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

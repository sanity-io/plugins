import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'
import {LINK_TYPE_NAME, linkType} from '../link-type'
import {CTA_TYPE_NAME} from './constants'

export {CTA_TYPE_NAME} from './constants'

export const ctaType = definePresetType<{}, 'object'>((context) => {
  const {fields, ...objectConfig} = context ?? {}

  return {
    composes: [linkType],
    schemaType: defineType({
      name: CTA_TYPE_NAME,
      title: 'Call to action',
      ...objectConfig,
      type: 'object',
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
        ...(fields ?? []),
      ],
    }),
  }
})

import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'
import {IMAGE_TYPE_NAME} from './constants'

export {IMAGE_TYPE_NAME} from './constants'

export interface ImageTypeConfig {
  altText?: boolean
  caption?: boolean
  hotspot?: boolean
}

export const imageType = definePresetType<ImageTypeConfig, 'object', 'preview'>((context) => {
  const {altText, caption, hotspot, fields, ...objectConfig} = context ?? {}

  const altTextEnabled = altText !== false
  const captionEnabled = caption !== false
  const hotspotEnabled = hotspot !== false

  return {
    name: IMAGE_TYPE_NAME,
    schemaType: defineType({
      name: IMAGE_TYPE_NAME,
      title: 'Image',
      ...objectConfig,
      type: 'object',
      fields: [
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: {
            hotspot: hotspotEnabled,
          },
        }),
        ...(altTextEnabled
          ? [
              defineField({
                name: 'altText',
                title: 'Alt text',
                type: 'string',
                validation: (rule) => rule.warning('Alt text improves accessibility.'),
              }),
            ]
          : []),
        ...(captionEnabled
          ? [
              defineField({
                name: 'caption',
                title: 'Caption',
                type: 'text',
              }),
            ]
          : []),
        ...(fields ?? []),
      ],
      preview: {
        select: {
          title: altTextEnabled
            ? 'altText'
            : captionEnabled
              ? 'caption'
              : 'image.asset.originalFilename',
          media: 'image',
        },
      },
    }),
  }
})

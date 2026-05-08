import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

export interface ImageTypeConfig {
  altText?: boolean
  caption?: boolean
  hotspot?: boolean
}

export const imageType = definePresetType<ImageTypeConfig, 'object', 'preview'>({
  name: 'image',
  identifier: 'core.image',
  schemaType: (config) => {
    const {altText = true, caption = true, hotspot = true, fields, ...objectConfig} = config

    return defineType({
      ...objectConfig,
      type: 'object',
      fields: [
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: {
            hotspot,
          },
        }),
        ...(altText
          ? [
              defineField({
                name: 'altText',
                title: 'Alt text',
                type: 'string',
                validation: (rule) => rule.warning('Alt text improves accessibility.'),
              }),
            ]
          : []),
        ...(caption
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
          title: altText ? 'altText' : caption ? 'caption' : 'image.asset.originalFilename',
          media: 'image',
        },
      },
    })
  },
})

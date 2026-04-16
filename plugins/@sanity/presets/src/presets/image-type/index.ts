import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

export interface ImageTypeConfig {
  altText?: boolean
  caption?: boolean
  hotspot?: boolean
}

export const imageType = definePresetType<ImageTypeConfig, 'object', 'preview'>((context) => {
  const {altText = true, caption = true, hotspot = true, fields, ...objectConfig} = context

  return {
    name: 'image',
    identifier: 'core.presets.image',
    schemaType: defineType({
      name: 'image',
      title: 'Image',
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
    }),
  }
})

import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

export interface ImageTypeConfig {
  altText?: boolean
  caption?: boolean
  hotspot?: boolean
}

export const imageType = definePresetType<ImageTypeConfig, 'image', 'preview'>({
  name: 'image',
  identifier: 'core.image',
  schemaType: (config) => {
    const {altText = true, caption = true, hotspot = true, fields, ...imageConfig} = config

    return defineType({
      ...imageConfig,
      type: 'image',
      // hotspot is the curated default; callers override other image options (accept, sources, storeOriginalFilename) via the map.options hook
      options: {
        hotspot,
      },
      fields: [
        ...(altText
          ? [
              defineField({
                name: 'altText',
                title: 'Alt text',
                description:
                  'Describes the image for screen readers and search engines. Important for accessibility.',
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
          title: altText ? 'altText' : caption ? 'caption' : 'asset.originalFilename',
        },
      },
    })
  },
})

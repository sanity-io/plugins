import {getImageDimensions} from '@sanity/asset-utils'
import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

export const seoType = definePresetType<{}, 'object'>((config) => {
  const {fields, ...objectConfig} = config

  return {
    name: 'seo',
    identifier: 'core.presets.seo',
    schemaType: defineType({
      name: 'seo',
      title: 'Web page metadata (SEO)',
      ...objectConfig,
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
          validation: (rule) => rule.max(70).info('Search engines may truncate this title.'),
        }),
        defineField({
          name: 'description',
          title: 'Description',
          type: 'text',
          validation: (rule) => rule.max(150).info('Search engines may truncate this description.'),
        }),
        defineField({
          name: 'ogImage',
          title: 'Open Graph image',
          type: 'image',
          description: 'Landscape 1200x630 (1.91:1)',
          options: {
            hotspot: {
              previews: [
                {
                  title: 'Landscape (1.91:1)',
                  aspectRatio: 1.91 / 1,
                },
              ],
            },
          },
          validation: (Rule) =>
            Rule.custom((value) => {
              if (!value?.asset?._ref) {
                return true
              }

              const {height, width} = getImageDimensions(value.asset?._ref)

              if (height !== 630 || width !== 1200) {
                return 'Open Graph image must be 1200x630'
              }

              return true
            }),
        }),
        ...(fields ?? []),
      ],
    }),
  }
})

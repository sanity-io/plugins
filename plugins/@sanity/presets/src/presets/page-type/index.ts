import {getImageDimensions} from '@sanity/asset-utils'
import {ALL_FIELDS_GROUP, defineArrayMember, defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

export interface PageTypeConfig {
  pageBuilderBlocks?: string[]
}

export const pageType = definePresetType<PageTypeConfig, 'document'>((context) => {
  const {pageBuilderBlocks, groups, fields, ...documentConfig} = context ?? {}

  return {
    name: 'page',
    identifier: 'core.presets.page',
    schemaType: defineType({
      name: 'core.presets.page',
      title: 'Page',
      ...documentConfig,
      type: 'document',
      groups: [
        {
          ...ALL_FIELDS_GROUP,
          hidden: true,
        },
        {
          name: 'main',
          title: 'Main',
          default: true,
        },
        {
          name: 'metadata',
          title: 'Metadata',
        },
        ...(groups ?? []),
      ],
      fields: [
        defineField({
          name: 'name',
          title: 'Name',
          type: 'string',
          group: 'main',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'slug',
          title: 'Slug',
          type: 'slug',
          group: 'main',
          options: {
            source: 'name',
          },
        }),
        defineField({
          name: 'content',
          title: 'Content',
          group: 'main',
          type: 'array',
          of: (pageBuilderBlocks ?? []).map((typeName) =>
            defineArrayMember({
              type: typeName,
            }),
          ),
        }),
        defineField({
          name: 'seo',
          title: 'SEO',
          type: 'object',
          group: 'metadata',
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
              validation: (rule) =>
                rule.max(150).info('Search engines may truncate this description.'),
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
          ],
        }),
        ...(fields ?? []),
      ],
    }),
  }
})

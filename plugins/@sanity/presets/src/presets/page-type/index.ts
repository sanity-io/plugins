import {ALL_FIELDS_GROUP, defineArrayMember, defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'
import {seoType} from '../seo-type'

export interface PageTypeConfig {
  pageBuilderBlocks: string[]
}

export const pageType = definePresetType<PageTypeConfig>((context) => {
  const pageBuilderBlocks = context?.pageBuilderBlocks ?? []

  return {
    composes: [seoType],
    schemaType: defineType({
      name: 'core.presets.page',
      type: 'document',
      title: 'Page',
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
          of: pageBuilderBlocks.map((typeName) =>
            defineArrayMember({
              type: typeName,
            }),
          ),
        }),
        defineField({
          name: 'seo',
          title: 'SEO',
          type: 'core.presets.seo',
          group: 'metadata',
        }),
      ],
    }),
  }
})

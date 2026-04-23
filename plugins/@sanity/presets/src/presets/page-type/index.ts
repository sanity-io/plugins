import {ALL_FIELDS_GROUP, defineArrayMember, defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

export interface PageTypeConfig {
  pageBuilderBlocks?: string[]
}

export const pageType = definePresetType<PageTypeConfig, 'document'>({
  name: 'page',
  identifier: 'core.page',
  schemaType: (config, registry) => {
    const {pageBuilderBlocks, groups, fields, ...documentConfig} = config

    return defineType({
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
        registry.getPreset('seo', {
          name: 'seo',
          title: 'SEO',
          group: 'metadata',
        }),
        ...(fields ?? []),
      ],
    })
  },
})

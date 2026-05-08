import {
  ALL_FIELDS_GROUP,
  defineArrayMember,
  defineField,
  defineType,
  type FieldDefinition,
  type SchemaTypeDefinition,
} from 'sanity'

import {definePresetType} from '../../definePresetType'

export type PageBuilderBlock = string | (SchemaTypeDefinition & FieldDefinition)

export interface PageTypeConfig {
  pageBuilderBlocks?: PageBuilderBlock[]
}

export const pageType = definePresetType<PageTypeConfig, 'document'>({
  name: 'page',
  identifier: 'core.page',
  schemaType: (config, registry) => {
    const {pageBuilderBlocks, groups, fields, ...documentConfig} = config

    return defineType({
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
          of: (pageBuilderBlocks ?? []).map((block) =>
            typeof block === 'string' ? defineArrayMember({type: block}) : defineArrayMember(block),
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

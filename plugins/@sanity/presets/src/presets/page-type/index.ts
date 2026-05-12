import {
  ALL_FIELDS_GROUP,
  type ArrayDefinition,
  defineArrayMember,
  defineField,
  defineType,
  type FieldDefinition,
  type SchemaTypeDefinition,
} from 'sanity'

import {definePresetType} from '../../definePresetType'

export type PageBuilderBlock = string | (SchemaTypeDefinition & FieldDefinition)

type LookupArrayPreset = (name: string) => ArrayDefinition | undefined

// Sanity rejects array members whose `type` resolves to another array. Wrap
// array presets in an object so they can serve as page-builder members.
function wrapArrayAsPageBuilderBlock(arraySchema: ArrayDefinition) {
  const components = 'components' in arraySchema ? arraySchema.components : undefined
  return defineArrayMember({
    name: arraySchema.name,
    title: arraySchema.title,
    type: 'object',
    fields: [
      defineField({
        name: 'content',
        type: 'array',
        of: arraySchema.of,
        components,
      }),
    ],
  })
}

function toPageBuilderArrayMember(block: PageBuilderBlock, lookupArrayPreset: LookupArrayPreset) {
  if (typeof block === 'string') {
    const arrayPreset = lookupArrayPreset(block)
    if (arrayPreset) {
      return wrapArrayAsPageBuilderBlock(arrayPreset)
    }
    return defineArrayMember({type: block})
  }
  if (block.type === 'array') {
    // oxlint-disable-next-line no-unsafe-type-assertion -- discriminating on `type` does not narrow the intersected union
    return wrapArrayAsPageBuilderBlock(block as ArrayDefinition)
  }
  return defineArrayMember(block)
}

// Defer building `content.of` so by-name references resolve after every
// `define<X>` has run. Memoised for stable array identity across reads.
function defineLazyContentField(
  blocks: PageBuilderBlock[],
  lookupArrayPreset: LookupArrayPreset,
): FieldDefinition {
  let cached: ReturnType<typeof toPageBuilderArrayMember>[] | undefined
  return defineField({
    name: 'content',
    title: 'Content',
    group: 'main',
    type: 'array',
    get of() {
      cached ??= blocks.map((block) => toPageBuilderArrayMember(block, lookupArrayPreset))
      return cached
    },
  })
}

export interface PageTypeConfig {
  pageBuilderBlocks?: PageBuilderBlock[]
}

// `lookupArrayPreset` is closure-injected by the registry to keep it off
// the public `RegistryContext`. The default `pageType` below uses a no-op.
export function createPageType({lookupArrayPreset}: {lookupArrayPreset: LookupArrayPreset}) {
  return definePresetType<PageTypeConfig, 'document'>({
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
          defineLazyContentField(pageBuilderBlocks ?? [], lookupArrayPreset),
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
}

export const pageType = createPageType({lookupArrayPreset: () => undefined})

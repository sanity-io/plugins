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

// Resolves a string reference in `pageBuilderBlocks` to its registered schema
// only when that name resolves to an array preset (otherwise `undefined`).
// The registry injects this via `createPageType` so it can read the registered
// schema map; standalone use of `pageType` falls back to a no-op lookup.
type LookupArrayPreset = (name: string) => ArrayDefinition | undefined

// Sanity rejects array members whose `type` resolves to another array. When a
// page builder block is an array preset (e.g. `defineRichText`), wrap it in
// an object whose `content` field holds the portable text array. The source
// array's `components` (carrying the registry's telemetry collector) move to
// the inner `content` field so usage tracking still fires when the editor
// opens. Accepts the structural shape both call sites already produce so the
// inline branch can pass an `ArrayDefinition` without an extra cast.
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

// `pageBuilderBlocks` may include string references to presets the user
// defines later in their module. Defer materialising `content.of` until first
// access via a getter, so the registry is fully populated by the time we
// resolve names. The result is memoised because Sanity's schema compiler
// reads `of` repeatedly and expects a stable array identity.
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

// Builds the page preset with an injected `lookupArrayPreset`. The registry
// uses this to give `pageType` access to its registered schema map without
// widening the public `RegistryContext` for all preset authors.
export function createPageType({lookupArrayPreset}: {lookupArrayPreset: LookupArrayPreset}) {
  return definePresetType<PageTypeConfig, 'document'>({
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

// Default instance used when `pageType` is imported directly (tests,
// standalone composition). The registry replaces this at composition time
// with an instance whose `lookupArrayPreset` reads its registered schemas.
export const pageType = createPageType({lookupArrayPreset: () => undefined})

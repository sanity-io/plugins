import {BlockElementIcon} from '@sanity/icons/BlockElement'
import type {ComponentType} from 'react'

import type {PickerItem} from './types'

type ItemPresentation = {
  title: string
  icon: ComponentType
  description: string | undefined
}

type SchemaTypeLike = {
  name: string
  title?: string
  description?: string
  icon?: ComponentType
  type?: SchemaTypeLike
  /** Reference types carry their targets here; core reads `to[0].icon`. */
  to?: ReadonlyArray<{icon?: ComponentType}>
}

/**
 * Resolves what a picker row shows for an item, following the same fallback
 * chains Studio's built-in insert menu uses: icon from the member type, its
 * parent type, a reference target, then the generic block icon; title from
 * the member type or its capitalized name. The curated description (from
 * `items` metadata) wins over the schema type's own — curation is the more
 * specific intent.
 */
export function resolveItemPresentation(
  item: PickerItem,
  schemaType: SchemaTypeLike | undefined,
): ItemPresentation {
  if (!schemaType) {
    return {
      description: item.description,
      icon: item.icon ?? BlockElementIcon,
      title: item.title || (item.action.type === 'insertBlock' ? item.action.blockType : item.id),
    }
  }
  return {
    description: item.description ?? schemaType.description,
    icon: schemaType.icon ?? schemaType.type?.icon ?? schemaType.to?.[0]?.icon ?? BlockElementIcon,
    title: schemaType.title ?? upperFirst(schemaType.name),
  }
}

// Matches core's lodash `upperFirst`: capitalize the first character, leave
// the rest untouched (`codeBlock` -> `CodeBlock`, not `Codeblock`).
function upperFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

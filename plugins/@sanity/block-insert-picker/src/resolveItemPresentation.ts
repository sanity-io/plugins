import type {ComponentType} from 'react'

import type {PickerItem} from './types'

type ItemPresentation = {
  title: string
  icon: ComponentType | undefined
  description: string | undefined
}

type SchemaTypeLike = {
  name: string
  title?: string
  description?: string
  icon?: ComponentType
}

export function resolveItemPresentation(
  item: PickerItem,
  schemaType: SchemaTypeLike | undefined,
): ItemPresentation {
  if (!schemaType) {
    return {description: item.description, icon: undefined, title: item.title}
  }
  return {
    // The member schema type's own description wins when it defines one;
    // otherwise fall back to the curated description on the item.
    description: schemaType.description ?? item.description,
    icon: schemaType.icon,
    title: schemaType.title ?? schemaType.name,
  }
}

import type {PickerItem, PickerItemMetadata} from './types'

type ArrayTypeLike = {
  jsonType: string
  of: ReadonlyArray<{name: string}>
}

/**
 * Derives picker items from a portable-text array's member types, so the
 * picker automatically covers every insertable block the schema allows.
 * The optional metadata list curates triggers, keywords, grouping, and
 * descriptions per member type; its array order is the sort rank (see
 * PickerItemMetadata). Titles and icons intentionally stay unresolved here:
 * BlockInsertPicker resolves presentation from the member schema type, which
 * carries member-level config (a member-specific icon, a per-member title
 * override).
 */
export function derivePickerItems(
  arrayType: ArrayTypeLike | undefined,
  metadata: readonly PickerItemMetadata[] = [],
): PickerItem[] {
  if (!arrayType || arrayType.jsonType !== 'array') return []
  const entryByType = new Map(metadata.map((entry) => [entry.type, entry]))
  const rankByType = new Map(metadata.map((entry, index) => [entry.type, index]))
  return arrayType.of
    .filter((memberType) => memberType.name !== 'block')
    .map((memberType, schemaIndex) => ({name: memberType.name, schemaIndex}))
    .sort((a, b) => {
      const rankA = rankByType.get(a.name) ?? Number.MAX_SAFE_INTEGER
      const rankB = rankByType.get(b.name) ?? Number.MAX_SAFE_INTEGER
      return rankA - rankB || a.schemaIndex - b.schemaIndex
    })
    .map(({name}) => {
      const entry = entryByType.get(name)
      return {
        action: {blockType: name, type: 'insertBlock' as const},
        description: entry?.description,
        group: entry?.group,
        id: name,
        keywords: entry?.keywords,
        title: '',
        trigger: entry?.trigger,
      }
    })
}

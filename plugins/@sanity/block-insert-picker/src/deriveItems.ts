import type {PickerItem, PickerItemMetadata, PickerItemsContext} from './types'

/**
 * The member's own name plus every name up its compiled `type` chain, most
 * specific first: `{type: 'image', name: 'photo'}` yields `['photo',
 * 'image', ...]`. Metadata and presets match against this chain so curation
 * can target either the member name or the underlying type name.
 */
export function typeNameChain(memberType: {
  name: string
  type?: {name: string; type?: unknown} | undefined
}): string[] {
  const names: string[] = []
  let current: {name: string; type?: unknown} | undefined = memberType
  while (current && typeof current.name === 'string') {
    names.push(current.name)
    current =
      current.type && typeof current.type === 'object' && 'name' in current.type
        ? // oxlint-disable-next-line no-unsafe-type-assertion
          (current.type as {name: string; type?: unknown})
        : undefined
  }
  return names
}

/**
 * Derives picker items from a portable-text array's insertable member types
 * (see PickerItemsContext), so the picker automatically covers every object
 * block the schema allows. The optional metadata list curates triggers,
 * keywords, grouping, badges, visibility, and descriptions per member type;
 * its array order is the sort rank (see PickerItemMetadata). Titles and
 * icons intentionally stay unresolved here: BlockInsertPicker resolves
 * presentation from the member schema type, which carries member-level
 * config (a member-specific icon, a per-member title override).
 */
export function derivePickerItems(
  context: PickerItemsContext,
  metadata: readonly PickerItemMetadata[] = [],
): PickerItem[] {
  return context.memberTypes
    .map((memberType, schemaIndex) => {
      const chain = typeNameChain(memberType)
      // The member's own name wins over a resolved-chain match, so an entry
      // for `photo` beats an entry for `image` on `{type: 'image', name:
      // 'photo'}` — but whichever matches, its array position is the rank.
      const nameRank = metadata.findIndex((entry) => entry.type === memberType.name)
      const rank =
        nameRank === -1 ? metadata.findIndex((entry) => chain.includes(entry.type)) : nameRank
      const entry = rank === -1 ? undefined : metadata[rank]
      return {
        entry,
        name: memberType.name,
        rank: rank === -1 ? Number.MAX_SAFE_INTEGER : rank,
        schemaIndex,
      }
    })
    .filter(({entry}) => !entry?.hidden)
    .sort((a, b) => a.rank - b.rank || a.schemaIndex - b.schemaIndex)
    .map(({entry, name}) => ({
      action: {blockType: name, type: 'insertBlock' as const},
      badge: entry?.badge,
      description: entry?.description,
      group: entry?.group,
      id: name,
      keywords: entry?.keywords,
      openOnInsert: entry?.openOnInsert,
      title: '',
      trigger: entry?.trigger,
    }))
}

/**
 * Metadata entries whose `type` matches neither a member name nor any name
 * in a member's resolved type chain — almost always a typo. Surfaced as a
 * dev-mode warning by BlockInsertPicker.
 */
export function unknownMetadataTypes(
  context: PickerItemsContext,
  metadata: readonly PickerItemMetadata[],
): string[] {
  const known = new Set(context.memberTypes.flatMap((memberType) => typeNameChain(memberType)))
  return metadata.map((entry) => entry.type).filter((type) => !known.has(type))
}

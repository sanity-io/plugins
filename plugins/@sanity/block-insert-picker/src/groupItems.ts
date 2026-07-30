import type {PickerItem} from './types'

type PickerSection = {
  /** Category label, or null for items that carry no group. */
  group: null | string
  items: readonly PickerItem[]
}

/**
 * Flattens sections back into the single index space that keyboard navigation,
 * selection, and scroll-into-view all share. Rendering the sections and
 * indexing this array must stay derived from the same `groupPickerItems` call
 * so Enter inserts exactly the highlighted row.
 */
export function flattenSections(sections: readonly PickerSection[]): readonly PickerItem[] {
  return sections.flatMap((section) => section.items)
}

/**
 * Partitions items into sections by their `group`, preserving the incoming
 * order within each section and ordering the sections by first appearance.
 *
 * Because the caller feeds rank-ordered items (see derivePickerItems), the
 * first-appearance rule places the section holding the most-used block first,
 * without a separate ordering constant to drift out of sync. Items without a
 * group collapse into a single `group: null` section (e.g. a curated `items`
 * prop), so the flat/ungrouped case stays a no-op reordering.
 */
export function groupPickerItems(items: readonly PickerItem[]): PickerSection[] {
  const order: (null | string)[] = []
  const byGroup = new Map<null | string, PickerItem[]>()
  for (const item of items) {
    const key = item.group ?? null
    let bucket = byGroup.get(key)
    if (!bucket) {
      bucket = []
      byGroup.set(key, bucket)
      order.push(key)
    }
    bucket.push(item)
  }
  return order.map((key) => ({group: key, items: byGroup.get(key)!}))
}

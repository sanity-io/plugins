/**
 * Every user-facing string in the picker chrome, centralized so hosts can
 * translate or reword them via the `labels` option (the same pattern
 * `@sanity/insert-menu` uses for its label overrides). Item titles and
 * descriptions are schema/metadata content, not chrome — localize those
 * through `items` or `resolveItems` instead.
 */
export type BlockInsertPickerLabels = {
  /** Popover header; also the listbox aria-label. */
  title: string
  /** Empty state; `{query}` is replaced with the typed filter text. */
  noMatches: string
  /**
   * Screen-reader position announcement for the highlighted row; `{index}`
   * and `{count}` are replaced with the 1-based position and list length.
   */
  positionAnnouncement: string
  /**
   * Section header for items without a `group`, shown only when grouped
   * sections are also present.
   */
  ungroupedSection: string
  /** Footer legend verbs. */
  footerNavigate: string
  footerInsert: string
  footerDismiss: string
  footerAnywhere: string
  /** Toast title when resolving a block's initial value fails. */
  insertError: string
  /**
   * Toast description when the block the picker was anchored to is deleted
   * before the insert completes.
   */
  insertAnchorRemoved: string
}

const DEFAULT_LABELS: BlockInsertPickerLabels = {
  footerAnywhere: 'Anywhere',
  footerDismiss: 'Dismiss',
  footerInsert: 'Insert',
  footerNavigate: 'Navigate',
  insertAnchorRemoved: 'The block you were inserting into was removed',
  insertError: 'Could not insert block',
  noMatches: 'No matches for "{query}"',
  positionAnnouncement: '{index} of {count}',
  title: 'Insert block',
  ungroupedSection: 'Other blocks',
}

export function resolveLabels(
  overrides: Partial<BlockInsertPickerLabels> | undefined,
): BlockInsertPickerLabels {
  return overrides ? {...DEFAULT_LABELS, ...overrides} : DEFAULT_LABELS
}

/** Fills the `{query}` placeholder in the no-matches label. */
export function formatNoMatches(labels: BlockInsertPickerLabels, query: string): string {
  // Function replacement: a query containing replacement patterns ("$&")
  // must land verbatim, not be interpreted by String.replace.
  return labels.noMatches.replace('{query}', () => query)
}

/** Fills `{index}`/`{count}` in the screen-reader position announcement. */
export function formatPosition(
  labels: BlockInsertPickerLabels,
  index: number,
  count: number,
): string {
  return labels.positionAnnouncement
    .replace('{index}', () => String(index))
    .replace('{count}', () => String(count))
}

/**
 * Pair-store snapshots used to decide whether a document currently exists.
 *
 * Intentionally structural: `useDocumentPane().editState` is the live source of
 * truth, and we should not depend on form `_rev` (that field can linger on the
 * last displayed snapshot after delete).
 */
export type DocumentPairSnapshots = {
  ready?: boolean
  draft?: unknown
  published?: unknown
  version?: unknown
} | null

/**
 * Whether the document currently has a draft, published, or version snapshot
 * in the pair store.
 *
 * Studio's delete action does not set `useDocumentPane().isDeleting` (that
 * flag is a separate pane field the built-in Delete action never writes). After
 * delete, form `_rev` can also remain on the last displayed snapshot. The pair
 * store clearing `draft` / `published` / `version` is the signal that patching
 * would recreate the document.
 */
export function documentExistsInStore(editState: DocumentPairSnapshots): boolean {
  if (!editState || editState.ready === false) {
    return false
  }

  return Boolean(editState.draft || editState.published || editState.version)
}

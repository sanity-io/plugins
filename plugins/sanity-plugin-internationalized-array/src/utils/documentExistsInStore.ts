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

/**
 * Whether the pair store has confirmed the document is absent: the store is
 * ready but has no draft, published, or version snapshot.
 *
 * Intentionally not the negation of {@link documentExistsInStore}. Loading
 * states (missing `editState` or `ready === false`) are neither "exists" nor
 * "missing" — the pair listener can re-emit not-ready snapshots on
 * subscription churn or reconnect, and treating those as missing would make a
 * transient blip look like a delete.
 */
export function documentMissingFromStore(editState: DocumentPairSnapshots): boolean {
  if (!editState || editState.ready === false) {
    return false
  }

  return !editState.draft && !editState.published && !editState.version
}

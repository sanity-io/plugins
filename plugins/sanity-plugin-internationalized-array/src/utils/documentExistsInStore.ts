/**
 * Pair-store snapshots used to decide whether a document currently exists.
 *
 * Intentionally structural: `useDocumentPane().editState` is the live source of
 * truth, and we should not depend on form `_rev` (that field can linger on the
 * last displayed snapshot after delete).
 */
export type DocumentPairSnapshots = {
  ready?: boolean
  scopeId?: string
  draft?: unknown
  published?: unknown
  version?: unknown
} | null

/**
 * Whether the document this pane is editing currently exists in the pair store.
 *
 * Studio's delete action does not set `useDocumentPane().isDeleting` (that
 * flag is a separate pane field the built-in Delete action never writes). After
 * delete, form `_rev` can also remain on the last displayed snapshot. The pair
 * store clearing the relevant snapshot is the signal that patching would
 * recreate the document.
 *
 * When editing a version (`scopeId` set), only the version snapshot counts:
 * discarding a release version leaves the base draft/published pair in the
 * store, and patching the version would recreate it.
 */
export function documentExistsInStore(editState: DocumentPairSnapshots): boolean {
  if (!editState || editState.ready === false) {
    return false
  }

  if (editState.scopeId !== undefined) {
    return Boolean(editState.version)
  }

  return Boolean(editState.draft || editState.published || editState.version)
}

/**
 * Whether the pair store has confirmed the document is absent: the store is
 * ready and the snapshot this pane is editing is gone (see
 * {@link documentExistsInStore} for which snapshots count).
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

  return !documentExistsInStore(editState)
}

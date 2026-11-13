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
  /**
   * Bundle segment of the version document id when this pane is editing a
   * release/version (not the base draft/published pair). From
   * `EditStateFor.scopeId`.
   */
  scopeId?: string
} | null

/**
 * Whether this pane is targeting a version document rather than the base pair.
 *
 * When true, only `version` is the snapshot form patches write to — sibling
 * draft/published must not count as existence (discarding a release version
 * leaves the base pair in the store).
 */
function isEditingVersion(editState: NonNullable<DocumentPairSnapshots>): boolean {
  return editState.scopeId !== undefined
}

/**
 * Whether the document this pane would patch still has a snapshot in the pair
 * store.
 *
 * Studio's delete action does not set `useDocumentPane().isDeleting` (that
 * flag is a separate pane field the built-in Delete action never writes). After
 * delete, form `_rev` can also remain on the last displayed snapshot. The pair
 * store clearing the relevant snapshot is the signal that patching would
 * recreate the document.
 *
 * For a version perspective (`scopeId` set), only `version` counts. For the
 * base pair, any of draft / published / version does.
 */
export function documentExistsInStore(editState: DocumentPairSnapshots): boolean {
  if (!editState || editState.ready === false) {
    return false
  }

  if (isEditingVersion(editState)) {
    return Boolean(editState.version)
  }

  return Boolean(editState.draft || editState.published || editState.version)
}

/**
 * Whether the pair store has confirmed the document this pane would patch is
 * absent: the store is ready but the relevant snapshot(s) are gone.
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

  if (isEditingVersion(editState)) {
    return !editState.version
  }

  return !editState.draft && !editState.published && !editState.version
}

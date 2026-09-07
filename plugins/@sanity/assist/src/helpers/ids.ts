import {
  getDraftId,
  getPublishedId,
  getVersionFromId,
  isVersionId,
  type SystemVariant,
  type TargetDocumentState,
} from 'sanity'

import {assistDocumentIdPrefix, assistDocumentStatusIdPrefix} from '../types'

const illegalIdChars = /[^a-zA-Z0-9._-]/g

export function assistDocumentId(documentType: string) {
  return `${assistDocumentIdPrefix}${documentType}`.replace(illegalIdChars, '_')
}

export function assistTasksStatusId(documentId: string) {
  if (isVersionId(documentId)) {
    // Creates an id: sanity.assist.status.<versionName>.<documentId>
    return `${assistDocumentStatusIdPrefix}${getVersionFromId(documentId)}.${getPublishedId(documentId)}`
  }

  // Creates an id: sanity.assist.status<documentId>
  return `${assistDocumentStatusIdPrefix}${getPublishedId(documentId)}`
}

/**
 * Document id Assist write endpoints must patch, once `targetDocumentState` is
 * ready. The target is picked in this order:
 *
 * 1. `releaseId` (the selected perspective) wins and yields the version sibling.
 * 2. Live-edit types write published.
 * 3. Otherwise the draft sibling, if it exists.
 * 4. If the draft sibling is missing and a content variant is selected, the
 *    draft id advertised by the published sibling (`_system.draft`).
 * 5. Without a variant, `drafts.*` derived from `documentId` (virtual draft
 *    after publish).
 *
 * Returns `undefined` until the target is ready, or when a selected release
 * or variant has no writable sibling.
 */
export function getAssistWriteDocumentId({
  documentId,
  liveEdit,
  releaseId,
  variant,
  targetDocumentState,
}: {
  documentId: string
  liveEdit?: boolean
  releaseId?: string
  variant?: SystemVariant
  targetDocumentState?: TargetDocumentState
}): string | undefined {
  if (
    targetDocumentState?.status !== 'ready' &&
    targetDocumentState?.status !== 'variant-missing'
  ) {
    return undefined
  }
  if (releaseId) {
    return targetDocumentState.siblings.version?._id
  }

  if (liveEdit) {
    return targetDocumentState.siblings.published?._id
  }
  return (
    targetDocumentState.siblings.draft?._id ||
    // If the draft sibling is missing, but it's a virtual draft we can use the draft id referenced from the published document.
    (variant
      ? targetDocumentState.siblings.published?._system?.draft?._ref
      : getDraftId(documentId))
  )
}

/**
 * Perspective scope for `useSyncState` while Assist waits on a write.
 * Version documents use their version name; drafts and published use the default scope.
 */
export function getAssistSyncScopeId(documentId: string | undefined): string | undefined {
  if (!documentId || !isVersionId(documentId)) {
    return undefined
  }
  return getVersionFromId(documentId)
}

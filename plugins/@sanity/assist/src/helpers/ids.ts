import {
  getDraftId,
  getPublishedId,
  getVersionFromId,
  getVersionId,
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
 * Returns the id Assist writes to, or `undefined` if there is none. The first
 * matching case applies:
 *
 * 1. With `releaseId`, use the version sibling, or the derived version id for
 *    a new document without a variant. A version `documentId`, as in a pinned
 *    release pane, also uses the version sibling, so Assist never writes to
 *    the base draft. Variant ids are version ids too, so variants skip this.
 * 2. For live-edit types, use the published sibling, or the derived published
 *    id for a new document without a variant.
 * 3. Use the draft sibling.
 * 4. For `variant-missing` in the `drafts` bundle, use `creatableTarget.id` or
 *    the published sibling's `_system.draft` ref. A `ready` published variant
 *    can have the same ref, but its pane is read-only.
 * 5. Without a variant, use the derived draft id.
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
  const {published, draft, version} = targetDocumentState.siblings
  const isNew = !variant && !published && !draft && !version

  if (releaseId || (!variant && isVersionId(documentId))) {
    return version?._id ?? (releaseId && isNew ? getVersionId(documentId, releaseId) : undefined)
  }
  if (liveEdit) {
    return published?._id ?? (isNew ? getPublishedId(documentId) : undefined)
  }
  if (draft) {
    return draft._id
  }
  if (targetDocumentState.status === 'variant-missing' && targetDocumentState.bundle === 'drafts') {
    return targetDocumentState.creatableTarget?.id ?? published?._system?.draft?._ref
  }
  return variant ? undefined : getDraftId(documentId)
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

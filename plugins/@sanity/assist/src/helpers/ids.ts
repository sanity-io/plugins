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
 * Document id Assist write endpoints must patch, once `targetDocumentState` is
 * ready. The target is picked in this order:
 *
 * 1. `releaseId` (the selected perspective) wins and yields the version sibling.
 *    A pane that already holds a version id without `releaseId` (for example a
 *    pinned release pane) also uses the version sibling, so we never fall
 *    through to `getDraftId` and rewrite `versions.*` to the base draft.
 *    Variant document ids are also version ids; those keep the draft path
 *    when `variant` is set. A brand-new document (no siblings at all) under a
 *    release gets the derived release version id: Studio creates that version
 *    on first edit. An existing document outside the release has no write
 *    target; Studio blocks editing it until it is added to the release.
 * 2. Live-edit types write published, or the derived published id for a
 *    brand-new document without a variant.
 * 3. Otherwise the draft sibling, if it exists.
 * 4. If the draft sibling is missing, only a drafts-bundle `variant-missing`
 *    creatable target may use the advertised draft id (`creatableTarget.id`,
 *    or `_system.draft` on the published sibling). A ready published variant
 *    can advertise the same ref while the pane is read-only; that is not a
 *    write target.
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
  const {published, draft, version} = targetDocumentState.siblings
  const isNewDocument = !published && !draft && !version

  if (releaseId || (!variant && isVersionId(documentId))) {
    if (version) {
      return version._id
    }
    return releaseId && !variant && isNewDocument ? getVersionId(documentId, releaseId) : undefined
  }

  if (liveEdit) {
    if (published) {
      return published._id
    }
    return !variant && isNewDocument ? getPublishedId(documentId) : undefined
  }

  if (draft?._id) {
    return draft._id
  }

  if (targetDocumentState.status === 'variant-missing' && targetDocumentState.bundle === 'drafts') {
    return targetDocumentState.creatableTarget?.id ?? published?._system?.draft?._ref
  }

  if (variant) {
    return undefined
  }

  return getDraftId(documentId)
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

import {
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
 * Document id Assist write endpoints must patch.
 *
 * `documentId` may carry any prefix; only its published id is used. The target
 * is picked in this order:
 *
 * 1. `options.releaseId` (the selected perspective) wins and yields that
 *    release's version id, even if `documentId` is already a version id.
 * 2. Without a `releaseId`, a version id is kept as is.
 * 3. Live-edit types write published.
 * 4. Everything else writes `drafts.*`, even when Studio field-action props
 *    still carry the published id (virtual draft after publish).
 */
export function getAssistWriteDocumentId(
  options: {
    liveEdit?: boolean
    releaseId?: string
    variant?: SystemVariant
    targetDocumentState?: TargetDocumentState
  } = {},
): string | undefined {
  if (options.targetDocumentState?.status !== 'ready') {
    return undefined
  }
  if (options.releaseId) {
    return options.targetDocumentState.siblings.version?._id
  }

  if (options.liveEdit) {
    return options.targetDocumentState.siblings.published?._id
  }
  return (
    options.targetDocumentState.siblings.draft?._id ||
    // If the draft sibling is missing, but it's a virtual draft we can use the draft id referenced from the published document.
    options.targetDocumentState.siblings.published?._system?.draft?._ref
  )
}

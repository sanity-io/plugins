import {getDraftId, getPublishedId, getVersionFromId, getVersionId, isVersionId} from 'sanity'

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
 * `documentId` may carry any prefix. The target is picked in this order:
 *
 * 1. A version id is kept as is. That includes release versions *and* opaque
 *    variant scopes (`versions.<scopeId>.<id>`). A selected `releaseId` must
 *    not rewrite a variant id into `versions.<releaseId>.*`.
 * 2. `options.releaseId` (the selected perspective) yields that release's
 *    version id when the input is not already a version.
 * 3. Live-edit types write published.
 * 4. Everything else writes `drafts.*`, even when Studio field-action props
 *    still carry the published id (virtual draft after publish).
 */
export function getAssistWriteDocumentId(
  documentId: string,
  options: {liveEdit?: boolean; releaseId?: string} = {},
): string {
  if (isVersionId(documentId)) {
    return documentId
  }
  if (options.releaseId) {
    return getVersionId(documentId, options.releaseId)
  }
  if (options.liveEdit) {
    return getPublishedId(documentId)
  }
  return getDraftId(documentId)
}

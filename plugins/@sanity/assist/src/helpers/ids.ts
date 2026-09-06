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
 * Non-live-edit documents in the drafts perspective always target `drafts.*`,
 * even when Studio field-action props still carry the published id (virtual
 * draft after publish). Live-edit types write published. Release versions
 * keep their version id.
 */
export function getAssistWriteDocumentId(
  documentId: string,
  options: {liveEdit?: boolean; releaseId?: string} = {},
): string {
  if (options.releaseId) {
    return getVersionId(getPublishedId(documentId), options.releaseId)
  }
  if (isVersionId(documentId)) {
    return documentId
  }
  if (options.liveEdit) {
    return getPublishedId(documentId)
  }
  return getDraftId(documentId)
}

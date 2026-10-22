import {
  getPublishedId,
  getVersionFromId,
  useDocumentOperation,
  useFormValue,
  useSchema,
} from 'sanity'

import {type SummaryTargetField, summaryTargetFields} from '../robots/applySummary'

export interface SummaryTarget {
  document: Record<string, unknown>
  fields: SummaryTargetField[]
  /** Edits land in a draft that still needs publishing, unless the type is live-edited. */
  isDraft: boolean
  /** Why the document can't take the values now, e.g. while it loads. */
  disabledReason?: string | undefined
  apply: (values: Record<string, unknown>) => void
}

/**
 * The document the video field sits in, as the place a summary is applied to: its top-level
 * fields, written as a normal edit (draft or release version alike). Form inputs only.
 */
export function useSummaryTarget(): SummaryTarget {
  const document = (useFormValue([]) ?? {}) as Record<string, unknown>
  const id = typeof document['_id'] === 'string' ? document['_id'] : ''
  const typeName = typeof document['_type'] === 'string' ? document['_type'] : ''
  const schemaType = useSchema().get(typeName)
  const objectType = schemaType?.jsonType === 'object' ? schemaType : undefined
  const {patch} = useDocumentOperation(getPublishedId(id), typeName, getVersionFromId(id))

  return {
    document,
    fields: summaryTargetFields(objectType),
    isDraft: !(objectType as {liveEdit?: boolean} | undefined)?.liveEdit,
    disabledReason: patch.disabled ? 'This document can’t be edited right now.' : undefined,
    apply: (values) => patch.execute([{set: values}]),
  }
}

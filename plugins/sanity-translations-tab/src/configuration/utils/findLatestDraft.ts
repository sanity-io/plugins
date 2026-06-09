import {getDraftId, getPublishedId} from 'sanity'
import type {SanityClient, SanityDocument} from 'sanity'

//use perspectives in the future
export const findLatestDraft = (
  documentId: string,
  client: SanityClient,
): Promise<SanityDocument> => {
  const query = `*[_id == $id || _id == $draftId]`
  const id = getPublishedId(documentId)
  const params = {id, draftId: getDraftId(id)}
  return client.fetch<SanityDocument[]>(query, params).then((docs) => {
    const doc = docs.find((d) => d._id.startsWith('drafts.')) ?? docs[0]
    if (!doc) {
      throw new Error(`Document not found: ${documentId}`)
    }
    return doc
  })
}

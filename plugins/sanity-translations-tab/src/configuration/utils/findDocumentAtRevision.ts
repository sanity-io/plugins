import type {SanityClient, SanityDocument} from 'sanity'

//revision fetch
export const findDocumentAtRevision = async (
  documentId: string,
  rev: string,
  client: SanityClient,
): Promise<SanityDocument> => {
  const dataset = client.config().dataset
  const baseUrl = `/data/history/${dataset}/documents/${documentId}?revision=${rev}`
  const url = client.getUrl(baseUrl)
  const revisionDoc = await fetch(url, {credentials: 'include'})
    .then((req) => req.json())
    .then((req) => {
      if (req.documents && req.documents.length) {
        // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- history API response is untyped
        return req.documents[0] as SanityDocument
      }
      return null
    })

  if (!revisionDoc) {
    throw new Error(`Document revision not found: ${documentId}@${rev}`)
  }

  return revisionDoc
}

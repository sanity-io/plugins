import type {SanityClient, SanityDocumentLike} from 'sanity'

export const patchI18nDoc = async (
  i18nDocId: string,
  mergedDocument: SanityDocumentLike,
  translatedFields: Record<string, unknown>,
  client: SanityClient,
): Promise<void> => {
  const cleanedMerge: Record<string, unknown> = {}
  Object.entries(mergedDocument).forEach(([key, value]) => {
    if (
      //only patch those fields that had translated strings
      Object.keys(translatedFields).includes(key) &&
      //don't overwrite any existing system values on the i18n doc
      !['_id', '_rev', '_updatedAt', 'language'].includes(key)
    ) {
      cleanedMerge[key] = value
    }
  })

  await client
    .transaction()
    .patch(i18nDocId, (p) => p.set(cleanedMerge))
    .commit()
}

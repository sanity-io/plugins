import type {SanityClient, SanityDocumentLike} from 'sanity'

export const getTranslationMetadata = (
  id: string,
  client: SanityClient,
  baseLanguage: string,
): Promise<SanityDocumentLike | null> => {
  return client.fetch(
    `*[
        _type == 'translation.metadata' &&
        translations[language == $baseLanguage || _key == $baseLanguage][0].value._ref == $id
      ][0]`,
    {baseLanguage, id},
  )
}

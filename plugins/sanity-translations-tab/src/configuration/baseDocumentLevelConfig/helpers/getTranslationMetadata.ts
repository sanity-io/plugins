import type {SanityClient, SanityDocumentLike} from 'sanity'

export const getTranslationMetadata = (
  id: string,
  client: SanityClient,
  baseLanguage: string,
): Promise<SanityDocumentLike | null> => {
  //@sanity/document-internationalization v5 and below stores the language
  //in `_key`, v6+ stores it in a dedicated `language` field. Match both.
  return client.fetch(
    `*[
        _type == 'translation.metadata' &&
        translations[language == $baseLanguage || _key == $baseLanguage][0].value._ref == $id
      ][0]`,
    {baseLanguage, id},
  )
}

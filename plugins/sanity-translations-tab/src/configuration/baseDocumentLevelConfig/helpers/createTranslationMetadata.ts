import type {KeyedObject, Reference, SanityClient, SanityDocumentLike} from 'sanity'

type TranslationReference = KeyedObject & {
  _type: 'internationalizedArrayReferenceValue'
  language?: string
  value: Reference
}

export const createTranslationMetadata = (
  document: SanityDocumentLike,
  client: SanityClient,
  baseLanguage: string,
): Promise<SanityDocumentLike> => {
  //set the language in both `_key` (document-internationalization v5 and
  //below) and `language` (v6+) so either version of the plugin can read
  //the metadata document
  const baseLangEntry: TranslationReference = {
    _key: baseLanguage,
    _type: 'internationalizedArrayReferenceValue',
    language: baseLanguage,
    value: {
      _type: 'reference',
      _ref: document._id.replace('drafts.', ''),
    },
  }

  if (document._id.startsWith('drafts.')) {
    baseLangEntry.value = {
      ...baseLangEntry.value,
      _weak: true,
      //this should reflect doc i18n config when this
      //plugin is able to take that as a config option
      _strengthenOnPublish: {
        type: document._type,
      },
    }
  }

  return client.create({
    _type: 'translation.metadata',
    translations: [baseLangEntry],
  })
}

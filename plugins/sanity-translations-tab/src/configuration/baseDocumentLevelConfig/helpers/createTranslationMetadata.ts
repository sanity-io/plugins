import {getDraftId, getPublishedId} from 'sanity'
import type {KeyedObject, Reference, SanityClient, SanityDocumentLike} from 'sanity'

type TranslationReference = KeyedObject & {
  _type: 'internationalizedArrayReferenceValue'
  value: Reference
}

export const createTranslationMetadata = (
  document: SanityDocumentLike,
  client: SanityClient,
  baseLanguage: string,
): Promise<SanityDocumentLike> => {
  const publishedId = getPublishedId(document._id)
  const isDraft = document._id === getDraftId(publishedId)
  const baseLangEntry: TranslationReference = {
    _key: baseLanguage,
    _type: 'internationalizedArrayReferenceValue',
    value: {
      _type: 'reference',
      _ref: publishedId,
    },
  }

  if (isDraft) {
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

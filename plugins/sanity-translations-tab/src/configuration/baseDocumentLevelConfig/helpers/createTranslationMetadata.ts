import {randomKey} from '@sanity/util/content'
import type {KeyedObject, Reference, SanityClient, SanityDocumentLike} from 'sanity'
import {LANGUAGE_FIELD} from 'sanity-naive-html-serializer'

import type {MetadataFormat} from '../../../types'

type TranslationReference = KeyedObject & {
  _type: 'internationalizedArrayReferenceValue'
  language?: string
  value: Reference
}

export const createTranslationMetadata = (
  document: SanityDocumentLike,
  client: SanityClient,
  baseLanguage: string,
  newMetadataFormat: MetadataFormat = 'language-field',
): Promise<SanityDocumentLike> => {
  const baseLangEntry: TranslationReference =
    newMetadataFormat === 'legacy'
      ? {
          _key: baseLanguage,
          _type: 'internationalizedArrayReferenceValue',
          value: {
            _type: 'reference',
            _ref: document._id.replace('drafts.', ''),
          },
        }
      : {
          _key: randomKey(),
          _type: 'internationalizedArrayReferenceValue',
          [LANGUAGE_FIELD]: baseLanguage,
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

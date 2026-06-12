import {randomKey} from '@sanity/util/content'
import type {SanityClient, SanityDocumentLike} from 'sanity'
import {getItemLanguage, LANGUAGE_FIELD, usesLanguageField} from 'sanity-naive-html-serializer'

import type {MetadataFormat} from '../../../types'

type TranslationEntry = Record<string, unknown> & {
  _key?: string
  language?: string
}

export const createI18nDocAndPatchMetadata = (
  translatedDoc: SanityDocumentLike,
  localeId: string,
  client: SanityClient,
  translationMetadata: SanityDocumentLike,
  languageField: string = 'language',
  newMetadataFormat: MetadataFormat = 'language-field',
): void => {
  translatedDoc[languageField] = localeId
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- translation metadata shape from i18n plugin
  const translations = translationMetadata['translations'] as TranslationEntry[]
  const existingLocaleKey = translations.find(
    (translation) => getItemLanguage(translation) === localeId,
  )
  const operation = existingLocaleKey ? 'replace' : 'after'
  //target the existing entry by its real `_key` so it works for both formats
  const location = existingLocaleKey
    ? `translations[_key == "${existingLocaleKey._key}"]`
    : 'translations[-1]'

  //mirror the format of the existing metadata entries; fall back to the configured
  //default for brand-new metadata documents
  const useLanguageField = translations.length
    ? usesLanguageField(translations)
    : newMetadataFormat !== 'legacy'

  const value = {
    _type: 'reference',
    _ref: '',
    _weak: true,
    _strengthenOnPublish: {
      type: '',
    },
  }

  //remove system fields
  const {_updatedAt, _createdAt, ...rest} = translatedDoc
  void client.create({...rest, _id: 'drafts.'}).then((doc) => {
    value._ref = doc._id.replace('drafts.', '')
    value._strengthenOnPublish.type = doc._type
    //preserve the existing entry's `_key` when replacing, so entry identity
    //stays stable across repeated imports
    const newEntry: TranslationEntry = useLanguageField
      ? {
          _key: existingLocaleKey?._key ?? randomKey(),
          _type: 'internationalizedArrayReferenceValue',
          [LANGUAGE_FIELD]: localeId,
          value,
        }
      : {_key: localeId, _type: 'internationalizedArrayReferenceValue', value}

    return client
      .transaction()
      .patch(translationMetadata._id, (p) => p.insert(operation, location, [newEntry]))
      .commit()
  })
}

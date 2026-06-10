import type {SanityClient, SanityDocumentLike} from 'sanity'

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
): void => {
  translatedDoc[languageField] = localeId
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- translation metadata shape from i18n plugin
  const translations = translationMetadata['translations'] as TranslationEntry[]
  //document-internationalization v5 and below stores the language in `_key`,
  //v6+ stores it in a dedicated `language` field. Match both, and address
  //existing entries by their actual `_key`
  const existingLocaleEntry = translations.find(
    (translation) => (translation.language ?? translation['_key']) === localeId,
  )
  const operation = existingLocaleEntry ? 'replace' : 'after'
  const location = existingLocaleEntry
    ? `translations[_key == "${existingLocaleEntry['_key']}"]`
    : 'translations[-1]'

  //remove system fields
  const {_updatedAt, _createdAt, ...rest} = translatedDoc
  void client.create({...rest, _id: 'drafts.'}).then((doc) => {
    const _ref = doc._id.replace('drafts.', '')
    return client
      .transaction()
      .patch(translationMetadata._id, (p) =>
        p.insert(operation, location, [
          {
            //set the language in both `_key` (v5 and below) and `language`
            //(v6+) so either version of the plugin can read the metadata,
            //preserving the existing `_key` when replacing an entry
            _key: existingLocaleEntry?.['_key'] ?? localeId,
            _type: 'internationalizedArrayReferenceValue',
            language: localeId,
            value: {
              _type: 'reference',
              _ref,
              _weak: true,
              _strengthenOnPublish: {
                type: doc._type,
              },
            },
          },
        ]),
      )
      .commit()
  })
}

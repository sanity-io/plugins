import type {SanityClient, SanityDocumentLike} from 'sanity'

type TranslationEntry = Record<string, unknown> & {
  _key?: string
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
  const existingLocaleKey = translations.find((translation) => translation['_key'] === localeId)
  const operation = existingLocaleKey ? 'replace' : 'after'
  const location = existingLocaleKey ? `translations[_key == "${localeId}"]` : 'translations[-1]'

  //remove system fields
  const {_updatedAt, _createdAt, ...rest} = translatedDoc
  void client.create({...rest, _id: 'drafts.'}).then((doc) => {
    const _ref = doc._id.replace('drafts.', '')
    return client
      .transaction()
      .patch(translationMetadata._id, (p) =>
        p.insert(operation, location, [
          {
            _key: localeId,
            _type: 'internationalizedArrayReferenceValue',
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

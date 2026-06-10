import type {SanityClient, SanityDocumentLike} from 'sanity'
import {expect, test, vi} from 'vitest'

import {createTranslationMetadata} from './createTranslationMetadata'

const createMockClient = () => {
  const create = vi.fn((doc: SanityDocumentLike) => Promise.resolve({...doc, _id: 'metadata-id'}))
  return {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- partial mock of SanityClient
    client: {create} as unknown as SanityClient,
    create,
  }
}

test('creates a base language entry readable by document-internationalization v5 (_key) and v6 (language)', async () => {
  const {client, create} = createMockClient()

  await createTranslationMetadata({_id: 'drafts.base-doc-id', _type: 'article'}, client, 'en')

  expect(create).toHaveBeenCalledWith({
    _type: 'translation.metadata',
    translations: [
      {
        _key: 'en',
        _type: 'internationalizedArrayReferenceValue',
        language: 'en',
        value: {
          _type: 'reference',
          _ref: 'base-doc-id',
          _weak: true,
          _strengthenOnPublish: {type: 'article'},
        },
      },
    ],
  })
})

test('creates a strong reference for published base documents', async () => {
  const {client, create} = createMockClient()

  await createTranslationMetadata({_id: 'base-doc-id', _type: 'article'}, client, 'nb')

  expect(create).toHaveBeenCalledWith({
    _type: 'translation.metadata',
    translations: [
      {
        _key: 'nb',
        _type: 'internationalizedArrayReferenceValue',
        language: 'nb',
        value: {
          _type: 'reference',
          _ref: 'base-doc-id',
        },
      },
    ],
  })
})

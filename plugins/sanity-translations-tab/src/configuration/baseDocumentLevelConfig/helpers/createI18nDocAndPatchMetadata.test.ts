import type {SanityClient, SanityDocumentLike} from 'sanity'
import {expect, test, vi} from 'vitest'

import {createI18nDocAndPatchMetadata} from './createI18nDocAndPatchMetadata'

const createMockClient = () => {
  const insert = vi.fn()
  const patchBuilder = {insert}
  insert.mockReturnValue(patchBuilder)

  const transaction: Record<string, ReturnType<typeof vi.fn>> = {}
  transaction['patch'] = vi.fn(
    (_id: string, patchFn: (patch: typeof patchBuilder) => unknown): Record<string, unknown> => {
      patchFn(patchBuilder)
      return transaction
    },
  )
  transaction['commit'] = vi.fn(() => Promise.resolve({}))

  const client = {
    create: vi.fn((doc: SanityDocumentLike) =>
      Promise.resolve({...doc, _id: 'drafts.translated-doc-id', _type: 'article'}),
    ),
    transaction: vi.fn(() => transaction),
  }

  return {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- partial mock of SanityClient
    client: client as unknown as SanityClient,
    insert,
  }
}

const translatedDoc: SanityDocumentLike = {
  _id: 'drafts.base-doc-id',
  _type: 'article',
  title: 'Un titulo nuevo',
}

const metadataBase = {
  _id: 'metadata-id',
  _type: 'translation.metadata',
}

test('replaces an existing entry in v6 metadata (language field, random key)', async () => {
  const {client, insert} = createMockClient()
  const translationMetadata: SanityDocumentLike = {
    ...metadataBase,
    translations: [
      {_key: 'rand0m1', language: 'en', value: {_ref: 'base-doc-id'}},
      {_key: 'rand0m2', language: 'es', value: {_ref: 'old-es-doc-id'}},
    ],
  }

  createI18nDocAndPatchMetadata({...translatedDoc}, 'es', client, translationMetadata)

  await vi.waitFor(() => expect(insert).toHaveBeenCalled())
  expect(insert).toHaveBeenCalledWith('replace', 'translations[_key == "rand0m2"]', [
    {
      _key: 'rand0m2',
      _type: 'internationalizedArrayReferenceValue',
      language: 'es',
      value: {
        _type: 'reference',
        _ref: 'translated-doc-id',
        _weak: true,
        _strengthenOnPublish: {type: 'article'},
      },
    },
  ])
})

test('replaces an existing entry in v5 metadata (language in _key)', async () => {
  const {client, insert} = createMockClient()
  const translationMetadata: SanityDocumentLike = {
    ...metadataBase,
    translations: [
      {_key: 'en', value: {_ref: 'base-doc-id'}},
      {_key: 'es', value: {_ref: 'old-es-doc-id'}},
    ],
  }

  createI18nDocAndPatchMetadata({...translatedDoc}, 'es', client, translationMetadata)

  await vi.waitFor(() => expect(insert).toHaveBeenCalled())
  expect(insert).toHaveBeenCalledWith('replace', 'translations[_key == "es"]', [
    {
      _key: 'es',
      _type: 'internationalizedArrayReferenceValue',
      language: 'es',
      value: {
        _type: 'reference',
        _ref: 'translated-doc-id',
        _weak: true,
        _strengthenOnPublish: {type: 'article'},
      },
    },
  ])
})

test('appends a new entry readable by both metadata formats', async () => {
  const {client, insert} = createMockClient()
  const translationMetadata: SanityDocumentLike = {
    ...metadataBase,
    translations: [{_key: 'rand0m1', language: 'en', value: {_ref: 'base-doc-id'}}],
  }

  createI18nDocAndPatchMetadata({...translatedDoc}, 'de', client, translationMetadata)

  await vi.waitFor(() => expect(insert).toHaveBeenCalled())
  expect(insert).toHaveBeenCalledWith('after', 'translations[-1]', [
    {
      _key: 'de',
      _type: 'internationalizedArrayReferenceValue',
      language: 'de',
      value: {
        _type: 'reference',
        _ref: 'translated-doc-id',
        _weak: true,
        _strengthenOnPublish: {type: 'article'},
      },
    },
  ])
})

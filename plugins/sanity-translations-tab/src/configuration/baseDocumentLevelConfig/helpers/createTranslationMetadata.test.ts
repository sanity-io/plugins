import type {SanityClient, SanityDocumentLike} from 'sanity'
import {expect, test, vi} from 'vitest'

import {createTranslationMetadata} from './createTranslationMetadata'

const baseDoc = {_id: 'drafts.doc-1', _type: 'article'} as SanityDocumentLike

const getMockClient = () => {
  const created: SanityDocumentLike[] = []
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- minimal SanityClient mock for the test
  const client = {
    create: vi.fn((doc: SanityDocumentLike) => {
      created.push(doc)
      return Promise.resolve(doc)
    }),
  } as unknown as SanityClient
  return {client, created}
}

test('createTranslationMetadata writes the language-field format by default', async () => {
  const {client} = getMockClient()
  const result = (await createTranslationMetadata(baseDoc, client, 'en')) as Record<string, any>
  const entry = result['translations'][0]

  expect(entry.language).toEqual('en')
  expect(entry._key).not.toEqual('en')
  expect(entry._key).toBeTruthy()
})

test('createTranslationMetadata writes the legacy (_key) format when requested', async () => {
  const {client} = getMockClient()
  const result = (await createTranslationMetadata(baseDoc, client, 'en', 'legacy')) as Record<
    string,
    any
  >
  const entry = result['translations'][0]

  expect(entry._key).toEqual('en')
  expect(entry.language).toBeUndefined()
})

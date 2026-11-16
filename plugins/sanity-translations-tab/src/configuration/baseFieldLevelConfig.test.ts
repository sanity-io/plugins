import type {SanityClient, SanityDocument} from 'sanity'
import {expect, test, vi} from 'vitest'

import {fieldLevelPatch} from './baseFieldLevelConfig'

const block = (key: string, text: string) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [{_type: 'span', _key: `${key}-span`, text, marks: []}],
})

const baseDoc: SanityDocument = {
  _id: 'doc-1',
  _type: 'article',
  _rev: 'rev-1',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  title: {_type: 'localeString', en: 'Hello', fr: 'Old title'},
  body: {_type: 'localeBlockContent', en: [block('b1', 'Hello world')]},
}

// What the deserializer returns for a translated file: the translated values,
// still keyed by the base language they were exported from.
const translatedFields = {
  _id: 'doc-1',
  _type: 'article',
  title: {_type: 'localeString', en: 'Bonjour'},
  body: {_type: 'localeBlockContent', en: [block('b1', 'Bonjour le monde')]},
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- deserialized documents are loosely typed
} as unknown as SanityDocument

const getMockClient = () => {
  const patches: {id: string; set: Record<string, any>}[] = []
  const client = {
    fetch: vi.fn(() => Promise.resolve([baseDoc])),
    patch: vi.fn((id: string) => {
      const builder = {
        set: (set: Record<string, any>) => {
          patches.push({id, set})
          return builder
        },
        commit: () => Promise.resolve({}),
      }
      return builder
    }),
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- minimal SanityClient mock for the test
  } as unknown as SanityClient
  return {client, patches}
}

test.each([false, true])(
  'fieldLevelPatch writes the translation into the target locale (mergeWithTargetLocale: %s)',
  async (mergeWithTargetLocale) => {
    const {client, patches} = getMockClient()

    await fieldLevelPatch('doc-1', translatedFields, 'fr', client, 'en', mergeWithTargetLocale)

    expect(patches).toHaveLength(1)
    const [{id, set}] = patches
    expect(id).toEqual('doc-1')
    expect(set['title.fr']).toEqual('Bonjour')
    expect(set['body.fr']).toEqual([block('b1', 'Bonjour le monde')])
    // the base language is left alone
    expect(Object.keys(set).some((path) => path.endsWith('.en'))).toBe(false)
  },
)

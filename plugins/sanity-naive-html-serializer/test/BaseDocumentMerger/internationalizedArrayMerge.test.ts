import {expect, test} from 'vitest'

import {BaseDocumentMerger} from '../../src'
import {internationalizedArrayArticle} from '../BaseDocumentSerializer/utils'
import {getInternationalizedArrayDocument} from './utils'

const newDocument = getInternationalizedArrayDocument()
const internationalizedArrayPatches = BaseDocumentMerger.internationalizedArrayMerge(
  newDocument,
  internationalizedArrayArticle,
  'es_ES',
  'en',
  0,
)

test('Global internationalized array snapshot test', () => {
  expect(internationalizedArrayPatches).toMatchSnapshot()
})

test('Internationalized array merge returns patch operations', () => {
  expect(Array.isArray(internationalizedArrayPatches)).toBe(true)
  expect(internationalizedArrayPatches[0]).toEqual(
    expect.objectContaining({
      at: expect.any(String),
      selector: expect.any(String),
      items: expect.any(Array),
    }),
  )
})

test('Internationalized array merge preserves translated block shape', () => {
  const contentPatch = internationalizedArrayPatches.find((patch) =>
    patch.selector.startsWith('content'),
  )
  const patchedValue = contentPatch?.items[0]?.value
  expect(Array.isArray(patchedValue)).toBe(true)
  if (Array.isArray(patchedValue)) {
    expect(patchedValue[0]?.children[0]?.text).toEqual('New block text')
  }
})

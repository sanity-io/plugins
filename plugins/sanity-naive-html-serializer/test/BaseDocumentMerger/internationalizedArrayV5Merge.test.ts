import clone from 'just-clone'
import {describe, expect, test} from 'vitest'

import {BaseDocumentMerger} from '../../src'
import {internationalizedArrayArticle} from '../BaseDocumentSerializer/utils'
import {toV5InternationalizedArray} from '../helpers'
import {getInternationalizedArrayDocument} from './utils'

/*
 * sanity-plugin-internationalized-array v5 stores the language in a dedicated
 * `language` field with a random `_key`, where v4 stored the language in `_key`.
 * The merger should read both formats, and write patches in the format the
 * target document already uses.
 */
const v5Article = toV5InternationalizedArray(internationalizedArrayArticle)

interface PatchItem {
  _key: string
  _type: string
  language?: string
  value: unknown
}

interface Patch {
  at: string
  selector: string
  items: PatchItem[]
}

describe('merging translated content into a v5 base document', () => {
  //the same translated file, merged into a v4 and a v5 base document
  const newDocument = getInternationalizedArrayDocument()
  const v5Patches = BaseDocumentMerger.internationalizedArrayMerge(
    newDocument,
    v5Article,
    'es_ES',
    'en',
    0,
  ) as Patch[]
  const v4Patches = BaseDocumentMerger.internationalizedArrayMerge(
    newDocument,
    internationalizedArrayArticle,
    'es_ES',
    'en',
    0,
  ) as Patch[]

  test('produces the same patch targets and values as a v4 base document', () => {
    expect(v5Patches.length).toEqual(v4Patches.length)
    expect(v5Patches.map((patch) => patch.selector)).toEqual(
      v4Patches.map((patch) => patch.selector),
    )
    expect(v5Patches.map((patch) => patch.at)).toEqual(v4Patches.map((patch) => patch.at))
    expect(v5Patches.map((patch) => patch.items[0].value)).toEqual(
      v4Patches.map((patch) => patch.items[0].value),
    )
  })

  test('new items are written in the v5 format with a language field and random key', () => {
    v5Patches.forEach((patch) => {
      const item = patch.items[0]
      expect(item.language).toEqual('es_ES')
      expect(item._key).toMatch(/^[a-z0-9]{12}$/)
    })
  })

  test('v4 base documents still receive items in the v4 format', () => {
    v4Patches.forEach((patch) => {
      const item = patch.items[0]
      expect(item._key).toEqual('es_ES')
      expect(item.language).toBeUndefined()
    })
  })
})

describe('replacing an existing locale item in a v5 base document', () => {
  const baseDoc: Record<string, any> = clone(v5Article)
  baseDoc.title.push({
    _key: 'existingkey1',
    _type: 'internationalizedArrayStringFieldValue',
    language: 'es_ES',
    value: 'Un titulo viejo',
  })
  const patches = BaseDocumentMerger.internationalizedArrayMerge(
    getInternationalizedArrayDocument(),
    baseDoc,
    'es_ES',
    'en',
    0,
  ) as Patch[]

  test('replaces the existing item, addressing it by its actual key', () => {
    const titlePatch = patches.find((patch) => patch.selector.startsWith('title'))
    expect(titlePatch?.at).toEqual('replace')
    expect(titlePatch?.selector).toEqual('title[_key == "existingkey1"]')
    expect(titlePatch?.items[0]._key).toEqual('existingkey1')
    expect(titlePatch?.items[0].language).toEqual('es_ES')
    expect(titlePatch?.items[0].value).toEqual('A new document title')
  })
})

describe('merging a v5-formatted translated document', () => {
  //a translated document that never round-tripped through the serializer
  //and still stores its base language in the v5 format
  const translated: Record<string, any> = clone(v5Article)
  const titleItem = translated.title.find((item: PatchItem) => item.language === 'en')!
  titleItem.value = 'A v5 translated title'
  const patches = BaseDocumentMerger.internationalizedArrayMerge(
    translated,
    v5Article,
    'es_ES',
    'en',
    0,
  ) as Patch[]

  test('finds translated values via the language field', () => {
    const titlePatch = patches.find((patch) => patch.selector.startsWith('title'))
    expect(titlePatch?.at).toEqual('after')
    expect(titlePatch?.items[0].language).toEqual('es_ES')
    expect(titlePatch?.items[0].value).toEqual('A v5 translated title')
  })
})

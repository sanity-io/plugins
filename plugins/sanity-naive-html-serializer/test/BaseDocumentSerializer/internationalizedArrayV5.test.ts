import {expect, test, describe} from 'vitest'

import {BaseDocumentMerger} from '../../src'
import {getInternationalizedArrayDocument} from '../BaseDocumentMerger/utils'
import {getI18nArrayItem, getSerialized} from '../helpers'
import {findByClass, getHTMLNode, internationalizedArrayArticle} from './utils'

const findById = (children: HTMLCollection, id: string): Element | undefined => {
  return Array.from(children).find((node) => node.id.toLowerCase() === id.toLowerCase())
}

/*
 * Recursively converts a v4 internationalized array document (language in `_key`)
 * to the v5 format (language in a `language` field, with a stable random `_key`).
 */
const toV5 = (value: any): any => {
  if (Array.isArray(value)) {
    const isI18nArray =
      value.length > 0 &&
      typeof value[0] === 'object' &&
      value[0] !== null &&
      value[0]._type.startsWith('internationalizedArray')

    return value.map((item) => {
      if (isI18nArray && item && typeof item === 'object') {
        const {_key, ...rest} = item
        return {...toV5(rest), _key: `v5-${_key}`, language: _key}
      }
      return toV5(item)
    })
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, toV5(val)]))
  }

  return value
}

const v5Article = toV5(internationalizedArrayArticle)

describe('Serialization supports v5 (language field) internationalized arrays', () => {
  const serialized = getSerialized(v5Article, 'internationalizedArray')
  const docTree = getHTMLNode(serialized).body.children[0]!

  test('Base language string fields are exported for v5 data', () => {
    const titleObj = findByClass(docTree.children, 'title')
    const englishTitleHTML = findById(titleObj!.children, 'en')
    const englishTitleValueHTML = findByClass(englishTitleHTML!.children, 'value')

    expect(englishTitleValueHTML?.innerHTML).toEqual(
      getI18nArrayItem(internationalizedArrayArticle.title, 'en')?.value,
    )
  })

  test('The `language` code is not exposed as a translatable string', () => {
    expect(serialized.content).not.toContain('class="language"')
  })

  test('v5 documents serialize identically to v4 documents', () => {
    const serializedV4 = getSerialized(internationalizedArrayArticle, 'internationalizedArray')
    expect(serialized.content).toEqual(serializedV4.content)
  })

  test('Items are identified by language code, not by random key', () => {
    expect(serialized.content).toContain('id="en"')
    expect(serialized.content).not.toContain('v5-')
  })
})

describe('Merge mirrors the document format', () => {
  const translated = getInternationalizedArrayDocument()

  test('Writes v5 format (language field + random _key) when base doc is v5', () => {
    const patches = BaseDocumentMerger.internationalizedArrayMerge(
      translated,
      v5Article,
      'es_ES',
      'en',
      0,
    )
    expect(patches.length).toBeGreaterThan(0)
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion - test inspects merger patch output shape
    for (const patch of patches as Array<Record<string, any>>) {
      const item = patch.items[0]
      expect(item.language).toEqual('es_ES')
      expect(item._key).not.toEqual('es_ES')
      expect(item._key).toBeTruthy()
    }
  })

  test('Writes legacy format (_key = language) when base doc is v4', () => {
    const patches = BaseDocumentMerger.internationalizedArrayMerge(
      translated,
      internationalizedArrayArticle,
      'es_ES',
      'en',
      0,
    )
    expect(patches.length).toBeGreaterThan(0)
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion - test inspects merger patch output shape
    for (const patch of patches as Array<Record<string, any>>) {
      const item = patch.items[0]
      expect(item._key).toEqual('es_ES')
      expect(item.language).toBeUndefined()
    }
  })

  test('Replaces an existing v5 locale entry by its real _key', () => {
    const withExisting = toV5(internationalizedArrayArticle)
    withExisting.title.push({
      _key: 'existing-es-key',
      _type: 'internationalizedArrayStringFieldValue',
      language: 'es_ES',
      value: 'Old translation',
    })

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion - test inspects merger patch output shape
    const patches = BaseDocumentMerger.internationalizedArrayMerge(
      translated,
      withExisting,
      'es_ES',
      'en',
      0,
    ) as Array<Record<string, any>>

    const titlePatch = patches.find((patch) => patch.selector.startsWith('title'))
    expect(titlePatch?.at).toEqual('replace')
    expect(titlePatch?.selector).toContain('existing-es-key')
    //the replaced item keeps its `_key`, so item identity stays stable
    //across repeated imports
    expect(titlePatch?.items[0]._key).toEqual('existing-es-key')
    expect(titlePatch?.items[0].language).toEqual('es_ES')
  })

  test('Reads translated values from a raw v5-format translated document', () => {
    //a translated document that never round-tripped through the serializer
    //and still stores its base language in the v5 format
    const rawV5Translated = toV5(internationalizedArrayArticle)
    const titleItem = rawV5Translated.title.find(
      (item: Record<string, any>) => item.language === 'en',
    )
    titleItem.value = 'A raw v5 translated title'

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion - test inspects merger patch output shape
    const patches = BaseDocumentMerger.internationalizedArrayMerge(
      rawV5Translated,
      v5Article,
      'es_ES',
      'en',
      0,
    ) as Array<Record<string, any>>

    const titlePatch = patches.find((patch) => patch.selector.startsWith('title'))
    expect(titlePatch?.at).toEqual('after')
    expect(titlePatch?.items[0].language).toEqual('es_ES')
    expect(titlePatch?.items[0].value).toEqual('A raw v5 translated title')
  })
})

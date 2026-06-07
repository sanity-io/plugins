import {PortableTextBlock} from 'sanity'
import {expect, test, describe} from 'vitest'
import {getI18nArrayItem, getSerialized, getValidFields, toPlainText} from '../helpers'
import {findByClass, getHTMLNode, internationalizedArrayArticle} from './utils'

const serialized = getSerialized(internationalizedArrayArticle, 'internationalizedArray')
const docTree = getHTMLNode(serialized).body.children[0]

const findById = (children: HTMLCollection, id: string): Element | undefined => {
  return Array.from(children).find((node) => {
    return node.id.toLowerCase() === id.toLowerCase()
  })
}

test('Global test of working internationalized array-level functionality and snapshot match', () => {
  expect(serialized).toMatchSnapshot()
})

test('String and text types get serialized correctly at top-level -- internationalized array', () => {
  const titleObj = findByClass(docTree.children, 'title')
  const englishTitleHTML = findById(titleObj!.children, 'en')
  const englishTitleValueHTML = findByClass(englishTitleHTML?.children!, 'value')

  const snippetObj = findByClass(docTree.children, 'snippet')
  const englishSnippetHTML = findById(snippetObj!.children, 'en')
  const englishSnippetValueHTML = findByClass(englishSnippetHTML?.children!, 'value')

  expect(englishTitleValueHTML?.innerHTML).toEqual(
    getI18nArrayItem(internationalizedArrayArticle.title, 'en')?.value
  )

  expect(englishSnippetValueHTML?.innerHTML).toEqual(
    getI18nArrayItem(internationalizedArrayArticle.snippet, 'en')?.value
  )
})

describe('Presence and accuracy of fields in "vanilla" deserialization -- objects', () => {
  const getInternationalizedArrayObjectField = () => {
    const config = findByClass(docTree.children, 'config')
    const englishConfig = findById(config!.children, 'en')
    return findByClass(englishConfig!.children, 'value')?.children[0]
  }

  const objectField = getInternationalizedArrayObjectField()
  const origObjectField = getI18nArrayItem(internationalizedArrayArticle.config, 'en')
    ?.value as Record<string, any>

  test('Top-level nested objects contain all serializable fields -- internationalized array', () => {
    const fieldNames = getValidFields(origObjectField)

    const foundFieldNames = Array.from(objectField!.children).map((child) => child.className)
    expect(foundFieldNames.sort()).toEqual(fieldNames.sort())
  })

  test('Nested object in object contains all serializable fields -- internationalized array', () => {
    const nestedObject = findByClass(objectField!.children, 'objectAsField')!.children[0]
    const fieldNames = getValidFields(origObjectField.objectAsField)
    const foundFieldNames = Array.from(nestedObject!.children).map((child) => child.className)
    expect(foundFieldNames.sort()).toEqual(fieldNames.sort())
  })

  test('Nested object contains accurate values -- internationalized array', () => {
    const title = origObjectField.objectAsField.title
    const blockText = toPlainText(origObjectField.nestedArrayField)

    expect(objectField?.innerHTML).toContain(title)
    expect(objectField?.innerHTML).toContain(blockText)
  })

  test('Nested object in an object contains accurate values -- internationalized array', () => {
    const nestedObject = findByClass(objectField!.children, 'objectAsField')!.children[0]
    const title = origObjectField.objectAsField.title
    const blockText = toPlainText(origObjectField.objectAsField.content)

    expect(nestedObject.innerHTML).toContain(title)
    expect(nestedObject.innerHTML).toContain(blockText)
  })
})

/*
 * Presence and accuracy of fields in "vanilla" deserialization -- arrays
 */
describe('Presence and accurancy of fields in "vanilla" deserialization -- arrays', () => {
  const getInternationalizedArrayArrayField = () => {
    const content = findByClass(docTree.children, 'content')
    const englishContent = findById(content!.children, 'en')
    return findByClass(englishContent!.children, 'value')
  }
  const arrayField = getInternationalizedArrayArrayField()
  const origArrayField = getI18nArrayItem(internationalizedArrayArticle.content, 'en')
    ?.value as any[]

  test('Array contains all serializable blocks with keys, in order -- internationalized array', () => {
    const origKeys = origArrayField.map((block: PortableTextBlock) => block._key)
    const serializedKeys = Array.from(arrayField!.children).map((block) => block.id)
    expect(serializedKeys).toEqual(origKeys)
  })

  test('Array contains top-level block text -- internationalized array', () => {
    const blockText = toPlainText(origArrayField).trim()
    expect(arrayField?.innerHTML).toContain(blockText)
  })

  test('Object in array contains all serializable fields -- internationalized array', () => {
    const objectInArray = findByClass(arrayField!.children, 'objectField')
    const fieldNames = getValidFields(
      origArrayField.find((block: Record<string, any>) => block._type === 'objectField')
    )
    const foundFieldNames = Array.from(objectInArray!.children).map((child) => child.className)
    expect(foundFieldNames.sort()).toEqual(fieldNames.sort())
  })

  test('Object in array contains accurate values in nested object -- internationalized array', () => {
    const objectInArray = findByClass(arrayField!.children, 'objectField')
    const nestedObject = findByClass(objectInArray!.children, 'objectAsField')
    const title = origArrayField.find((block: Record<string, any>) => block._type === 'objectField')
      .objectAsField.title
    const blockText = toPlainText(
      origArrayField.find((block: Record<string, any>) => block._type === 'objectField')
        .objectAsField.content
    ).trim()
    expect(nestedObject?.innerHTML).toContain(title)
    expect(nestedObject?.innerHTML).toContain(blockText)
  })
})

//works, but requires another schema declaration. resolve later.
test('Nested locale fields make it to serialization, but only base lang', () => {
  const slices = findByClass(docTree.children, 'slices')?.children[0]
  const origSlices = internationalizedArrayArticle.slices[0].content
  const engSlice = getI18nArrayItem(origSlices, 'en').value
  const frenchSlice = getI18nArrayItem(origSlices, 'fr_FR').value
  //@ts-ignore
  expect(slices?.innerHTML).toContain(engSlice[0]!.children![0].text)
  //@ts-ignore
  expect(slices?.innerHTML).not.toContain(frenchSlice[0]!.children![0].text)
})

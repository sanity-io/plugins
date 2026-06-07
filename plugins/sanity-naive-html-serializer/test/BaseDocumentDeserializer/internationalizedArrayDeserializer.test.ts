import {PortableTextBlock} from 'sanity'
import {internationalizedArrayArticle} from '../BaseDocumentSerializer/utils'
import {getDeserialized, getI18nArrayItem, toPlainText} from '../helpers'
import {expect, test, describe} from 'vitest'

const deserialized = getDeserialized(internationalizedArrayArticle, 'internationalizedArray')

test('Global test of working internationalized array functionality and snapshot match', () => {
  expect(deserialized).toMatchSnapshot()
})

/*
 * Top-level plain text
 */

test('String and text types get deserialized correctly at top-level -- internationalized array', () => {
  const origTitle = getI18nArrayItem(internationalizedArrayArticle.title, 'en')?.value
  const origSnippet = getI18nArrayItem(internationalizedArrayArticle.snippet, 'en')?.value

  const deserializedTitle = getI18nArrayItem(deserialized.title, 'en')?.value
  const deserializedSnippet = getI18nArrayItem(deserialized.snippet, 'en')?.value

  expect(deserializedTitle).toEqual(origTitle)
  expect(deserializedSnippet).toEqual(origSnippet)
})

describe('Presence and accuracy of fields in "vanilla" deserialization -- objects', () => {
  const origObject = getI18nArrayItem(internationalizedArrayArticle.config, 'en')?.value as Record<
    string,
    any
  >
  const deserializedObject = getI18nArrayItem(deserialized.config, 'en')?.value as Record<
    string,
    any
  >

  test('Nested object contains accurate values -- internationalized array', () => {
    expect(origObject.title).toEqual(deserializedObject.title)

    const origBlockText = origObject.nestedArrayField
    const deserializedBlockText = deserializedObject.nestedArrayField

    const origKeys = origBlockText.map((block: PortableTextBlock) => block._key)
    const deserializedKeys = deserializedBlockText.map((block: PortableTextBlock) => block._key)

    expect(deserializedKeys.sort()).toEqual(origKeys.sort())
    expect(toPlainText(deserializedBlockText)).toEqual(toPlainText(origBlockText))
  })

  test('Nested object in an object contains accurate values -- internationalized array', () => {
    const origNestedObject = origObject.objectAsField
    const deserializedNestedObject = deserializedObject.objectAsField

    expect(origNestedObject.title).toEqual(deserializedNestedObject.title)

    const origKeys = origNestedObject.content.map((block: PortableTextBlock) => block._key)
    const deserializedKeys = deserializedNestedObject.content.map(
      (block: PortableTextBlock) => block._key
    )

    expect(origKeys.sort()).toEqual(deserializedKeys.sort())
    expect(toPlainText(deserializedNestedObject.content)).toEqual(
      toPlainText(origNestedObject.content)
    )
  })
})

describe('Presence and accuracy of fields in "vanilla" deserialization -- arrays', () => {
  const origContent = getI18nArrayItem(internationalizedArrayArticle.content, 'en')?.value as any[]
  const deserializedContent = getI18nArrayItem(deserialized.content, 'en')?.value as any[]

  test('Array contains all serializable blocks with keys, in order', () => {
    const origKeys = origContent.map((block: PortableTextBlock) => block._key)
    const deserializedKeys = deserializedContent.map((block: PortableTextBlock) => block._key)
    expect(deserializedKeys.sort()).toEqual(origKeys.sort())
  })

  test('Array contains top-level block text', () => {
    expect(toPlainText(deserializedContent)).toEqual(toPlainText(origContent))
  })

  test('Object in array contains accurate values in nested object', () => {
    const origTitle = origContent.find(
      (block: Record<string, any>) => block._type === 'objectField'
    ).objectAsField.title
    const deserializedTitle = deserializedContent.find(
      (block: Record<string, any>) => block._type === 'objectField'
    ).objectAsField.title
    expect(deserializedTitle).toEqual(origTitle)

    const origBlockText = toPlainText(
      origContent.find((block: Record<string, any>) => block._type === 'objectField').objectAsField
        .content
    ).trim()

    const deserializedBlockText = toPlainText(
      deserializedContent.find((block: Record<string, any>) => block._type === 'objectField')
        .objectAsField.content
    ).trim()

    expect(deserializedBlockText).toEqual(origBlockText)
  })
})

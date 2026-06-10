import {expect, test} from 'vitest'

import {getDeserialized, getSerialized, toV5InternationalizedArray} from '../helpers'
import {internationalizedArrayArticle} from './utils'

/*
 * sanity-plugin-internationalized-array v5 stores the language in a dedicated
 * `language` field with a random `_key`, where v4 stored the language in `_key`.
 * The serializer should treat both formats identically.
 */
const v5Article = toV5InternationalizedArray(internationalizedArrayArticle)
const serializedV4 = getSerialized(internationalizedArrayArticle, 'internationalizedArray')
const serializedV5 = getSerialized(v5Article, 'internationalizedArray')

test('v5 documents (language field) serialize identically to v4 documents (language in _key)', () => {
  expect(serializedV5.content).toEqual(serializedV4.content)
})

test('serialized v5 document identifies items by language code, not by random key', () => {
  expect(serializedV5.content).toContain('id="en"')
  expect(serializedV5.content).not.toContain('v5key')
})

test('the language field is not sent out as translatable content', () => {
  expect(serializedV5.content).not.toContain('class="language"')
})

test('v5 documents round-trip to translated files keyed by language', () => {
  const deserializedV5 = getDeserialized(v5Article, 'internationalizedArray')
  expect(deserializedV5.title).toEqual([
    {
      _key: 'en',
      _type: 'internationalizedArrayStringFieldValue',
      value: 'My Internationalized Array Article',
    },
  ])
})

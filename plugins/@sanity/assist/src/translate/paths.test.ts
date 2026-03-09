import {Schema} from '@sanity/schema'
import {
  defineType,
  type ObjectSchemaType,
  pathToString,
  type SanityDocumentLike,
  typed,
} from 'sanity'
import {describe, expect, test} from 'vitest'

import {
  defaultLanguageOutputs,
  type FieldLanguageMap,
  getDocumentMembersFlat,
  getFieldLanguageMap,
} from './paths'

describe('paths', () => {
  test('should return internationalizedArrayString paths and find translation mappings', () => {
    const docSchema: ObjectSchemaType = Schema.compile({
      name: 'test',
      types: [
        defineType({
          type: 'document',
          name: 'article',
          fields: [
            {type: 'string', name: 'title'},
            {
              type: 'object',
              name: 'localeTitle',
              fields: [
                {type: 'string', name: 'en'},
                {type: 'string', name: 'no'},
              ],
            },
            {
              type: 'array',
              name: 'translations',
              of: [
                {
                  type: 'object',
                  name: 'internationalizedArrayString',
                  fields: [{type: 'string', name: 'value'}],
                },
              ],
            },
          ],
        }),
      ],
    }).get('article')

    const doc: SanityDocumentLike = {
      _id: 'na',
      _type: 'article',
      title: 'some title',
      localeTitle: {
        en: 'en string',
      },
      translations: [
        {
          _type: 'internationalizedArrayString',
          _key: 'en',
          value: 'some string',
        },
      ],
    }

    const members = getDocumentMembersFlat(doc, docSchema)
    expect(members.map((p) => pathToString(p.path))).toEqual([
      'title',
      'localeTitle',
      'localeTitle.en',
      // this path has no value in the document, so are not included
      //'localeTitle.no',
      'translations',
      'translations[_key=="en"]',
      'translations[_key=="en"].value',
      // these path has no value in the document, so are not included
      //'translations[_key=="nb"]',
      //'translations[_key=="nb"].value',
    ])

    const transMap = getFieldLanguageMap(docSchema, members, 'en', ['nb'], defaultLanguageOutputs)

    expect(transMap).toEqual(
      typed<FieldLanguageMap[]>([
        {
          inputLanguageId: 'en',
          inputPath: ['translations', {_key: 'en'}],
          outputs: [{id: 'nb', outputPath: ['translations', {_key: 'nb'}]}],
        },
      ]),
    )
  })

  test('should use first type in array when array item is missing _type', () => {
    const docSchema: ObjectSchemaType = Schema.compile({
      name: 'test',
      types: [
        defineType({
          type: 'document',
          name: 'article',
          fields: [
            {
              type: 'array',
              name: 'translations',
              of: [
                {
                  type: 'object',
                  name: 'internationalizedArrayString',
                  fields: [{type: 'string', name: 'value'}],
                },
              ],
            },
          ],
        }),
      ],
    }).get('article')

    const doc: SanityDocumentLike = {
      _id: 'na',
      _type: 'article',
      translations: [
        {
          //assume type is missing in the data for some reason
          //_type: 'internationalizedArrayString',
          _key: 'en',
          value: 'some string',
        },
      ],
    }

    const members = getDocumentMembersFlat(doc, docSchema)
    expect(members.map((p) => pathToString(p.path))).toEqual([
      'translations',
      'translations[_key=="en"]',
      'translations[_key=="en"].value',
    ])
  })

  describe('v5 internationalizedArray (language field)', () => {
    const v5Schema = Schema.compile({
      name: 'test',
      types: [
        defineType({
          type: 'document',
          name: 'article',
          fields: [
            {
              type: 'array',
              name: 'translations',
              of: [
                {
                  type: 'object',
                  name: 'internationalizedArrayString',
                  fields: [
                    {type: 'string', name: 'language'},
                    {type: 'string', name: 'value'},
                  ],
                },
              ],
            },
          ],
        }),
      ],
    })

    test('should reuse existing target-language item key', () => {
      const docSchema: ObjectSchemaType = v5Schema.get('article')

      const doc: SanityDocumentLike = {
        _id: 'na',
        _type: 'article',
        translations: [
          {_type: 'internationalizedArrayString', _key: 'key-en', language: 'en', value: 'hello'},
          {_type: 'internationalizedArrayString', _key: 'key-nb', language: 'nb', value: 'hei'},
        ],
      }

      const members = getDocumentMembersFlat(doc, docSchema)
      const transMap = getFieldLanguageMap(docSchema, members, 'en', ['nb'], defaultLanguageOutputs)

      expect(transMap).toEqual(
        typed<FieldLanguageMap[]>([
          {
            inputLanguageId: 'en',
            inputPath: ['translations', {_key: 'key-en'}],
            outputs: [{id: 'nb', outputPath: ['translations', {_key: 'key-nb'}]}],
            relativeLanguagePath: ['language'],
          },
        ]),
      )
    })

    test('should generate a new 12-char key when no target-language item exists', () => {
      const docSchema: ObjectSchemaType = v5Schema.get('article')

      const doc: SanityDocumentLike = {
        _id: 'na',
        _type: 'article',
        translations: [
          {_type: 'internationalizedArrayString', _key: 'key-en', language: 'en', value: 'hello'},
        ],
      }

      const members = getDocumentMembersFlat(doc, docSchema)
      const transMap = getFieldLanguageMap(docSchema, members, 'en', ['nb'], defaultLanguageOutputs)

      expect(transMap).toHaveLength(1)
      const outputs = transMap.at(0)?.outputs ?? []
      expect(outputs).toHaveLength(1)
      const output = outputs.at(0)
      expect(output?.id).toBe('nb')
      expect(output?.outputPath.at(0)).toBe('translations')
      // A new random key should be generated — verify it has the expected 12-char length
      // oxlint-disable-next-line no-unsafe-type-assertion
      const generatedKey = (output?.outputPath.at(1) as any)?._key as string
      expect(typeof generatedKey).toBe('string')
      expect(generatedKey).toHaveLength(12)
    })

    test('should include relativeLanguagePath for v5 items', () => {
      const docSchema: ObjectSchemaType = v5Schema.get('article')

      const doc: SanityDocumentLike = {
        _id: 'na',
        _type: 'article',
        translations: [
          {_type: 'internationalizedArrayString', _key: 'key-en', language: 'en', value: 'hello'},
        ],
      }

      const members = getDocumentMembersFlat(doc, docSchema)
      const transMap = getFieldLanguageMap(docSchema, members, 'en', ['nb'], defaultLanguageOutputs)

      expect(transMap.at(0)?.relativeLanguagePath).toEqual(['language'])
    })
  })

  test('should limit depth to 1 when specified', () => {
    const docSchema: ObjectSchemaType = Schema.compile({
      name: 'test',
      types: [
        defineType({
          type: 'document',
          name: 'article',
          fields: [
            {
              type: 'array',
              name: 'translations',
              of: [
                {
                  type: 'object',
                  name: 'internationalizedArrayString',
                  fields: [{type: 'string', name: 'value'}],
                },
              ],
            },
          ],
        }),
      ],
    }).get('article')

    const doc: SanityDocumentLike = {
      _id: 'na',
      _type: 'article',
      translations: [
        {
          //assume type is missing in the data for some reason
          //_type: 'internationalizedArrayString',
          _key: 'en',
          value: 'some string',
        },
      ],
    }

    const members = getDocumentMembersFlat(doc, docSchema, 1)
    expect(members.map((p) => pathToString(p.path))).toEqual(['translations'])
  })
})

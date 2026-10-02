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

  test('should map translation paths for v5 internationalized array schema', () => {
    const docSchema: ObjectSchemaType = Schema.compile({
      name: 'test',
      types: [
        defineType({
          type: 'document',
          name: 'article',
          fields: [
            {
              type: 'array',
              name: 'translationsV5',
              of: [
                {
                  type: 'object',
                  name: 'internationalizedArrayStringValue',
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
    }).get('article')

    const doc: SanityDocumentLike = {
      _id: 'na',
      _type: 'article',
      translationsV5: [
        {
          _type: 'internationalizedArrayStringValue',
          _key: 'english-key',
          language: 'en',
          value: 'v5 english',
        },
        {
          _type: 'internationalizedArrayStringValue',
          _key: 'norwegian-key',
          language: 'nb',
          value: 'v5 norwegian',
        },
      ],
    }

    const members = getDocumentMembersFlat(doc, docSchema)

    expect(members.map((p) => pathToString(p.path))).toEqual([
      'translationsV5',
      'translationsV5[_key=="english-key"]',
      'translationsV5[_key=="english-key"].language',
      'translationsV5[_key=="english-key"].value',
      'translationsV5[_key=="norwegian-key"]',
      'translationsV5[_key=="norwegian-key"].language',
      'translationsV5[_key=="norwegian-key"].value',
    ])

    const transMap = getFieldLanguageMap(
      docSchema,
      members,
      'en',
      ['nb', 'es'],
      defaultLanguageOutputs,
    )

    expect(transMap).toEqual(
      typed<FieldLanguageMap[]>([
        {
          inputLanguageId: 'en',
          inputPath: ['translationsV5', {_key: 'english-key'}],
          outputs: [
            // Finds the existing translation and reuses the key
            {id: 'nb', outputPath: ['translationsV5', {_key: 'norwegian-key'}]},
            // Creates a new translation so it uses a new key
            {id: 'es', outputPath: ['translationsV5', {_key: expect.any(String)}]},
          ],
          relativeLanguagePath: ['language'],
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

  test('does not translate readOnly, hidden, or assist-excluded internationalized array fields', () => {
    const internationalizedString = {
      type: 'object' as const,
      name: 'internationalizedArrayStringValue',
      fields: [
        {type: 'string' as const, name: 'value'},
        // The language id is hidden in sanity-plugin-internationalized-array.
        // It must not block translating the writable item around it.
        {type: 'string' as const, name: 'language', hidden: true},
      ],
    }
    const docSchema: ObjectSchemaType = Schema.compile({
      name: 'test',
      types: [
        defineType({
          type: 'document',
          name: 'product',
          fields: [
            {
              type: 'array',
              name: 'title',
              of: [internationalizedString],
            },
            {
              type: 'array',
              name: 'slug',
              readOnly: true,
              of: [internationalizedString],
            },
            {
              type: 'array',
              name: 'internalName',
              hidden: true,
              of: [internationalizedString],
            },
            {
              type: 'array',
              name: 'sku',
              options: {aiAssist: {exclude: true}},
              of: [internationalizedString],
            },
            {
              type: 'object',
              name: 'locked',
              readOnly: true,
              fields: [
                {
                  type: 'array',
                  name: 'title',
                  of: [internationalizedString],
                },
              ],
            },
          ],
        }),
      ],
    }).get('product')

    const item = (value: string) => ({
      _type: 'internationalizedArrayStringValue',
      _key: 'english-key',
      language: 'en',
      value,
    })
    const doc: SanityDocumentLike = {
      _id: 'na',
      _type: 'product',
      title: [item('Hello')],
      slug: [item('hello')],
      internalName: [item('secret')],
      sku: [item('sku-1')],
      locked: {title: [item('Locked')]},
    }

    const members = getDocumentMembersFlat(doc, docSchema)
    expect(members.map((member) => pathToString(member.path))).toEqual([
      'title',
      'title[_key=="english-key"]',
      'title[_key=="english-key"].value',
    ])

    const transMap = getFieldLanguageMap(docSchema, members, 'en', ['nl'], defaultLanguageOutputs)
    expect(transMap).toEqual(
      typed<FieldLanguageMap[]>([
        {
          inputLanguageId: 'en',
          inputPath: ['title', {_key: 'english-key'}],
          outputs: [{id: 'nl', outputPath: ['title', {_key: expect.any(String)}]}],
          relativeLanguagePath: ['language'],
        },
      ]),
    )
  })

  test('does not output translations into readOnly or hidden locale fields', () => {
    const docSchema: ObjectSchemaType = Schema.compile({
      name: 'test',
      types: [
        defineType({
          type: 'object',
          name: 'localeString',
          fields: [
            {type: 'string', name: 'en'},
            {type: 'string', name: 'nl', readOnly: true},
            {type: 'string', name: 'de', hidden: true},
            {type: 'string', name: 'fr', options: {aiAssist: {exclude: true}}},
            {type: 'string', name: 'es'},
          ],
        }),
        defineType({
          type: 'document',
          name: 'article',
          fields: [{type: 'localeString', name: 'title'}],
        }),
      ],
    }).get('article')

    const doc: SanityDocumentLike = {
      _id: 'na',
      _type: 'article',
      title: {
        en: 'Hello',
        nl: 'Hallo',
        de: 'Hallo',
        fr: 'Bonjour',
        es: 'Hola',
      },
    }

    const members = getDocumentMembersFlat(doc, docSchema)
    expect(members.map((member) => pathToString(member.path))).toEqual([
      'title',
      'title.en',
      'title.es',
    ])

    const transMap = getFieldLanguageMap(
      docSchema,
      members,
      'en',
      ['nl', 'de', 'fr', 'es'],
      defaultLanguageOutputs,
    )
    expect(transMap).toEqual(
      typed<FieldLanguageMap[]>([
        {
          inputLanguageId: 'en',
          inputPath: ['title', 'en'],
          outputs: [{id: 'es', outputPath: ['title', 'es']}],
        },
      ]),
    )
  })
})

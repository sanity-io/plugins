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

  // Regression test for https://github.com/sanity-io/plugins/issues/912
  //
  // The README and docs promise that AI Assist will ignore fields marked
  // statically `readOnly: true` when running the Translate fields action.
  // In practice, `getFieldLanguageMap` does not consult the schema's
  // `readOnly` flag at all when building translation targets, so the
  // server-side handler receives the readOnly field as a write target.
  //
  // This test fails on `main` and demonstrates the contract violation.
  test('issue #912: should not include statically readOnly fields in field language map', () => {
    const docSchema: ObjectSchemaType = Schema.compile({
      name: 'test',
      types: [
        defineType({
          type: 'document',
          name: 'article',
          fields: [
            {
              type: 'array',
              name: 'title',
              of: [
                {
                  type: 'object',
                  name: 'internationalizedArrayString',
                  fields: [{type: 'string', name: 'value'}],
                },
              ],
            },
            {
              type: 'array',
              name: 'subtitle',
              // README contract: literal `readOnly: true` fields must be ignored
              // by Translate fields. They are not.
              readOnly: true,
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
      title: [{_type: 'internationalizedArrayString', _key: 'en', value: 'Hello'}],
      subtitle: [{_type: 'internationalizedArrayString', _key: 'en', value: 'Read-only original'}],
    }

    const members = getDocumentMembersFlat(doc, docSchema)
    const transMap = getFieldLanguageMap(docSchema, members, 'en', ['nb'], defaultLanguageOutputs)

    const inputPaths = transMap.map((m) => pathToString(m.inputPath))

    // Translate fields should pick up `title` (writable) but skip
    // `subtitle` (statically readOnly). On `main`, both are included.
    expect(inputPaths).toContain('title[_key=="en"]')
    expect(inputPaths).not.toContain('subtitle[_key=="en"]')
  })
})

import {
  createSchema,
  defineArrayMember,
  defineField,
  defineType,
  type ObjectSchemaType,
  type SanityDocument,
} from 'sanity'
import {describe, expect, test} from 'vitest'

import {removeExcludedPaths} from './excludePaths'

const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'articleWithExcludes',
      type: 'document',
      fields: [
        defineField({name: 'title', type: 'string'}),
        defineField({name: 'body', type: 'string'}),
        defineField({
          name: 'keepMe',
          type: 'string',
          options: {documentInternationalization: {exclude: false}},
        }),
        defineField({
          name: 'secret',
          type: 'string',
          options: {documentInternationalization: {exclude: true}},
        }),
        defineField({
          name: 'excluded',
          type: 'string',
          options: {documentInternationalization: {exclude: true}},
        }),
        defineField({
          name: 'metadata',
          type: 'object',
          fields: [
            defineField({name: 'author', type: 'string'}),
            defineField({
              name: 'internal',
              type: 'string',
              options: {documentInternationalization: {exclude: true}},
            }),
          ],
        }),
        defineField({
          name: 'blocks',
          type: 'array',
          of: [
            defineArrayMember({
              name: 'textBlock',
              type: 'object',
              fields: [
                defineField({name: 'text', type: 'string'}),
                defineField({
                  name: 'internal',
                  type: 'string',
                  options: {documentInternationalization: {exclude: true}},
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    defineType({
      name: 'articleWithoutExcludes',
      type: 'document',
      fields: [
        defineField({name: 'title', type: 'string'}),
        defineField({name: 'body', type: 'string'}),
      ],
    }),
    defineType({
      name: 'nonDocumentObject',
      type: 'object',
      fields: [defineField({name: 'title', type: 'string'})],
    }),
  ],
})

function getSchemaType(typeName: string): ObjectSchemaType {
  const schemaType = schema.get(typeName)
  if (!schemaType || schemaType.jsonType !== 'object') {
    throw new Error(`Expected object schema type: ${typeName}`)
  }

  return schemaType
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function expectRecord(value: unknown, message: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(message)
  }
  return value
}

describe('removeExcludedPaths', () => {
  const excludedSchemaType = getSchemaType('articleWithExcludes')
  const nonExcludedSchemaType = getSchemaType('articleWithoutExcludes')
  const nonDocumentSchemaType = getSchemaType('nonDocumentObject')

  test('returns null when doc is null', () => {
    const result = removeExcludedPaths(null, excludedSchemaType)
    expect(result).toBeNull()
  })

  test('returns doc unchanged when schemaType is not a document type', () => {
    const doc: SanityDocument = {
      _id: 'doc-1',
      _type: 'nonDocumentObject',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      title: 'Hello',
    }

    const result = removeExcludedPaths(doc, nonDocumentSchemaType)
    expect(result).toEqual(doc)
  })

  test('returns doc unchanged when no fields have exclude option', () => {
    const doc: SanityDocument = {
      _id: 'doc-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      title: 'Hello',
      body: 'World',
    }

    const result = removeExcludedPaths(doc, nonExcludedSchemaType)
    expect(result).toEqual(doc)
  })

  test('removes top-level field with exclude: true', () => {
    const doc: SanityDocument = {
      _id: 'doc-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      title: 'Hello',
      secret: 'should-be-removed',
    }

    const result = removeExcludedPaths(doc, excludedSchemaType)

    expect(result).not.toBeNull()
    expect(result!['title']).toBe('Hello')
    expect(result!['secret']).toBeUndefined()
  })

  test('preserves non-excluded fields', () => {
    const doc: SanityDocument = {
      _id: 'doc-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      title: 'Hello',
      body: 'Keep me',
      excluded: 'Remove me',
      secret: 'Also remove me',
    }

    const result = removeExcludedPaths(doc, excludedSchemaType)

    expect(result!._id).toBe('doc-1')
    expect(result!._type).toBe('article')
    expect(result!['title']).toBe('Hello')
    expect(result!['body']).toBe('Keep me')
    expect(result!['excluded']).toBeUndefined()
    expect(result!['secret']).toBeUndefined()
  })

  test('removes nested field with exclude: true', () => {
    const doc: SanityDocument = {
      _id: 'doc-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      title: 'Hello',
      metadata: {
        author: 'John',
        internal: 'should-be-removed',
      },
    }

    const result = removeExcludedPaths(doc, excludedSchemaType)
    const metadata = result?.['metadata']
    expect(metadata).toBeTypeOf('object')
    expect(result!['title']).toBe('Hello')
    const metadataRecord = expectRecord(metadata, 'Expected metadata to be an object')
    expect(metadataRecord['author']).toBe('John')
    expect(metadataRecord['internal']).toBeUndefined()
  })

  test('handles array fields with keyed items', () => {
    const doc: SanityDocument = {
      _id: 'doc-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      title: 'Hello',
      blocks: [
        {_key: 'block-1', _type: 'textBlock', text: 'Keep', internal: 'Remove'},
        {_key: 'block-2', _type: 'textBlock', text: 'Also keep', internal: 'Also remove'},
      ],
    }

    const result = removeExcludedPaths(doc, excludedSchemaType)

    expect(result!['title']).toBe('Hello')
    const blocks = result?.['blocks']
    expect(Array.isArray(blocks)).toBe(true)
    if (!Array.isArray(blocks)) {
      throw new Error('Expected blocks to be an array')
    }
    expect(blocks).toHaveLength(2)
    expect(isRecord(blocks[0])).toBe(true)
    expect(isRecord(blocks[1])).toBe(true)
    const firstBlock = expectRecord(blocks[0], 'Expected first block to be an object')
    const secondBlock = expectRecord(blocks[1], 'Expected second block to be an object')
    expect(firstBlock['text']).toBe('Keep')
    expect(firstBlock['internal']).toBeUndefined()
    expect(secondBlock['text']).toBe('Also keep')
    expect(secondBlock['internal']).toBeUndefined()
  })

  test('handles field with exclude: false (should not remove)', () => {
    const doc: SanityDocument = {
      _id: 'doc-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      title: 'Hello',
      keepMe: 'Still here',
    }

    const result = removeExcludedPaths(doc, excludedSchemaType)
    expect(result!['keepMe']).toBe('Still here')
  })

  test('handles fields without value (no error)', () => {
    const doc: SanityDocument = {
      _id: 'doc-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      title: 'Hello',
      // body is not set
      // secret is not set
    }

    const result = removeExcludedPaths(doc, excludedSchemaType)
    expect(result!['title']).toBe('Hello')
  })
})

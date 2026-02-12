import type {ObjectSchemaType, SanityDocument} from 'sanity'

import {beforeEach, describe, expect, test, vi} from 'vitest'

import {removeExcludedPaths} from './excludePaths'

// Mock the isDocumentSchemaType function from sanity
vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    isDocumentSchemaType: vi.fn(),
  }
})

// Import after mocking
import {isDocumentSchemaType} from 'sanity'

/**
 * Creates a minimal schema type for testing.
 */
function createSchemaType(
  fields: Array<{
    name: string
    jsonType?: string
    options?: {documentInternationalization?: {exclude?: boolean}}
    of?: Array<{name: string; fields?: Array<{name: string; type: {jsonType: string}}>}>
    fields?: Array<{
      name: string
      type: {
        jsonType: string
        options?: {documentInternationalization?: {exclude?: boolean}}
      }
    }>
  }>,
): ObjectSchemaType {
  return {
    name: 'testDocument',
    type: 'document',
    jsonType: 'object',
    fields: fields.map((f) => ({
      name: f.name,
      type: {
        name: f.name,
        jsonType: f.jsonType ?? 'string',
        options: f.options,
        of: f.of,
        fields: f.fields,
      },
    })),
  } as unknown as ObjectSchemaType
}

describe('removeExcludedPaths', () => {
  beforeEach(() => {
    vi.mocked(isDocumentSchemaType).mockReturnValue(true)
  })

  test('returns null when doc is null', () => {
    const schemaType = createSchemaType([{name: 'title'}])
    const result = removeExcludedPaths(null, schemaType)
    expect(result).toBeNull()
  })

  test('returns doc unchanged when schemaType is not a document type', () => {
    vi.mocked(isDocumentSchemaType).mockReturnValue(false)

    const doc: SanityDocument = {
      _id: 'doc-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      title: 'Hello',
    }
    const schemaType = createSchemaType([{name: 'title'}])

    const result = removeExcludedPaths(doc, schemaType)
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
    const schemaType = createSchemaType([{name: 'title'}, {name: 'body'}])

    const result = removeExcludedPaths(doc, schemaType)
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
    const schemaType = createSchemaType([
      {name: 'title'},
      {name: 'secret', options: {documentInternationalization: {exclude: true}}},
    ])

    const result = removeExcludedPaths(doc, schemaType)

    expect(result).not.toBeNull()
    expect(result!.title).toBe('Hello')
    expect(result!.secret).toBeUndefined()
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
    }
    const schemaType = createSchemaType([
      {name: 'title'},
      {name: 'body'},
      {name: 'excluded', options: {documentInternationalization: {exclude: true}}},
    ])

    const result = removeExcludedPaths(doc, schemaType)

    expect(result!._id).toBe('doc-1')
    expect(result!._type).toBe('article')
    expect(result!.title).toBe('Hello')
    expect(result!.body).toBe('Keep me')
    expect(result!.excluded).toBeUndefined()
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
    const schemaType = createSchemaType([
      {name: 'title'},
      {
        name: 'metadata',
        jsonType: 'object',
        fields: [
          {name: 'author', type: {jsonType: 'string'}},
          {
            name: 'internal',
            type: {
              jsonType: 'string',
              options: {documentInternationalization: {exclude: true}},
            },
          },
        ],
      },
    ])

    const result = removeExcludedPaths(doc, schemaType)

    expect(result!.title).toBe('Hello')
    expect((result!.metadata as {author: string}).author).toBe('John')
    expect((result!.metadata as {internal?: string}).internal).toBeUndefined()
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
    const schemaType = createSchemaType([
      {name: 'title'},
      {
        name: 'blocks',
        jsonType: 'array',
        of: [
          {
            name: 'textBlock',
            fields: [
              {name: 'text', type: {jsonType: 'string'}},
              {
                name: 'internal',
                type: {
                  jsonType: 'string',
                  options: {documentInternationalization: {exclude: true}},
                },
              },
            ],
          },
        ],
      },
    ])

    const result = removeExcludedPaths(doc, schemaType)

    expect(result!.title).toBe('Hello')
    const blocks = result!.blocks as Array<{_key: string; text: string; internal?: string}>
    expect(blocks).toHaveLength(2)
    expect(blocks[0].text).toBe('Keep')
    expect(blocks[0].internal).toBeUndefined()
    expect(blocks[1].text).toBe('Also keep')
    expect(blocks[1].internal).toBeUndefined()
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
    const schemaType = createSchemaType([
      {name: 'title'},
      {name: 'keepMe', options: {documentInternationalization: {exclude: false}}},
    ])

    const result = removeExcludedPaths(doc, schemaType)
    expect(result!.keepMe).toBe('Still here')
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
    }
    const schemaType = createSchemaType([
      {name: 'title'},
      {name: 'body', options: {documentInternationalization: {exclude: true}}},
    ])

    const result = removeExcludedPaths(doc, schemaType)
    expect(result!.title).toBe('Hello')
  })
})

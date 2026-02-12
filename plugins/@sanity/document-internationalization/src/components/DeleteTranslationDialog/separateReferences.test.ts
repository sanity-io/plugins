import type {SanityDocument} from 'sanity'

import {describe, expect, test} from 'vitest'

import {METADATA_SCHEMA_NAME} from '../../constants'
import {separateReferences} from './separateReferences'

function createDoc(id: string, type: string): SanityDocument {
  return {
    _id: id,
    _type: type,
    _rev: 'rev-1',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
  }
}

describe('separateReferences', () => {
  test('returns empty arrays for null input', () => {
    const result = separateReferences(null)
    expect(result.translations).toEqual([])
    expect(result.otherReferences).toEqual([])
  })

  test('returns empty arrays for undefined input (default)', () => {
    const result = separateReferences()
    expect(result.translations).toEqual([])
    expect(result.otherReferences).toEqual([])
  })

  test('returns empty arrays for empty array input', () => {
    const result = separateReferences([])
    expect(result.translations).toEqual([])
    expect(result.otherReferences).toEqual([])
  })

  test('separates translation.metadata docs into translations array', () => {
    const metadataDoc = createDoc('meta-1', METADATA_SCHEMA_NAME)
    const result = separateReferences([metadataDoc])

    expect(result.translations).toHaveLength(1)
    expect(result.translations[0]._id).toBe('meta-1')
    expect(result.otherReferences).toHaveLength(0)
  })

  test('separates other doc types into otherReferences array', () => {
    const articleDoc = createDoc('article-1', 'article')
    const result = separateReferences([articleDoc])

    expect(result.translations).toHaveLength(0)
    expect(result.otherReferences).toHaveLength(1)
    expect(result.otherReferences[0]._id).toBe('article-1')
  })

  test('handles mixed array of metadata and other docs', () => {
    const docs: SanityDocument[] = [
      createDoc('meta-1', METADATA_SCHEMA_NAME),
      createDoc('article-1', 'article'),
      createDoc('meta-2', METADATA_SCHEMA_NAME),
      createDoc('page-1', 'page'),
      createDoc('post-1', 'post'),
    ]

    const result = separateReferences(docs)

    expect(result.translations).toHaveLength(2)
    expect(result.translations.map((d) => d._id)).toEqual(['meta-1', 'meta-2'])

    expect(result.otherReferences).toHaveLength(3)
    expect(result.otherReferences.map((d) => d._id)).toEqual(['article-1', 'page-1', 'post-1'])
  })

  test('preserves document order within each category', () => {
    const docs: SanityDocument[] = [
      createDoc('meta-3', METADATA_SCHEMA_NAME),
      createDoc('meta-1', METADATA_SCHEMA_NAME),
      createDoc('meta-2', METADATA_SCHEMA_NAME),
    ]

    const result = separateReferences(docs)

    expect(result.translations.map((d) => d._id)).toEqual(['meta-3', 'meta-1', 'meta-2'])
  })

  test('handles array with only other references', () => {
    const docs: SanityDocument[] = [createDoc('article-1', 'article'), createDoc('page-1', 'page')]

    const result = separateReferences(docs)

    expect(result.translations).toHaveLength(0)
    expect(result.otherReferences).toHaveLength(2)
  })
})

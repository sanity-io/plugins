import type {SanityDocument} from 'sanity'

import {describe, expect, test} from 'vitest'

import {METADATA_SCHEMA_NAME} from '../../constants'
import {createMockDocument} from '../../test/helpers'
import {separateReferences} from './separateReferences'

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
    const metadataDoc = createMockDocument('meta-1', undefined, {type: METADATA_SCHEMA_NAME})
    const result = separateReferences([metadataDoc])

    expect(result.translations).toHaveLength(1)
    expect(result.translations[0]).toBeDefined()
    expect(result.translations[0]!._id).toBe('meta-1')
    expect(result.otherReferences).toHaveLength(0)
  })

  test('separates other doc types into otherReferences array', () => {
    const articleDoc = createMockDocument('article-1', undefined, {type: 'article'} as const)
    const result = separateReferences([articleDoc])

    expect(result.translations).toHaveLength(0)
    expect(result.otherReferences).toHaveLength(1)
    expect(result.otherReferences[0]).toBeDefined()
    expect(result.otherReferences[0]!._id).toBe('article-1')
  })

  test('handles mixed array of metadata and other docs', () => {
    const docs: SanityDocument[] = [
      createMockDocument('meta-1', undefined, {type: METADATA_SCHEMA_NAME}),
      createMockDocument('article-1', undefined, {type: 'article'}),
      createMockDocument('meta-2', undefined, {type: METADATA_SCHEMA_NAME}),
      createMockDocument('page-1', undefined, {type: 'page'}),
      createMockDocument('post-1', undefined, {type: 'post'}),
    ]

    const result = separateReferences(docs)

    expect(result.translations).toHaveLength(2)
    expect(result.translations.map((d) => d._id)).toEqual(['meta-1', 'meta-2'])

    expect(result.otherReferences).toHaveLength(3)
    expect(result.otherReferences.map((d) => d._id)).toEqual(['article-1', 'page-1', 'post-1'])
  })

  test('preserves document order within each category', () => {
    const docs: SanityDocument[] = [
      createMockDocument('meta-3', undefined, {type: METADATA_SCHEMA_NAME}),
      createMockDocument('meta-1', undefined, {type: METADATA_SCHEMA_NAME}),
      createMockDocument('meta-2', undefined, {type: METADATA_SCHEMA_NAME}),
    ]

    const result = separateReferences(docs)

    expect(result.translations.map((d) => d._id)).toEqual(['meta-3', 'meta-1', 'meta-2'])
  })

  test('handles array with only other references', () => {
    const docs: SanityDocument[] = [
      createMockDocument('article-1', undefined, {type: 'article'}),
      createMockDocument('page-1', undefined, {type: 'page'}),
    ]

    const result = separateReferences(docs)

    expect(result.translations).toHaveLength(0)
    expect(result.otherReferences).toHaveLength(2)
  })
})

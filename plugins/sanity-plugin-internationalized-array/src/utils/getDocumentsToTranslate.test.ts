import {describe, expect, test} from 'vitest'

import {getDocumentsToTranslate} from './getDocumentsToTranslate'

describe('getDocumentsToTranslate', () => {
  test('returns empty array for null/undefined input', () => {
    expect(getDocumentsToTranslate(null)).toEqual([])
    expect(getDocumentsToTranslate(undefined)).toEqual([])
  })

  test('returns empty array for primitive values', () => {
    expect(getDocumentsToTranslate('string')).toEqual([])
    expect(getDocumentsToTranslate(42)).toEqual([])
  })

  test('returns empty array for empty arrays', () => {
    const doc = {
      _id: 'doc1',
      _type: 'article',
      title: [],
    }
    const result = getDocumentsToTranslate(doc)
    expect(result).toEqual([])
  })

  test('finds internationalized array values in a flat document', () => {
    const doc = {
      _id: 'doc1',
      _type: 'article',
      title: [
        {
          _key: 'en',
          _type: 'internationalizedArrayStringValue',
          value: 'Hello',
        },
      ],
    }
    const result = getDocumentsToTranslate(doc)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      _type: 'internationalizedArrayStringValue',
      path: ['title'],
      pathString: 'title',
    })
  })

  test('finds nested internationalized array values in objects', () => {
    const doc = {
      _id: 'doc1',
      _type: 'article',
      content: {
        description: [
          {
            _key: 'en',
            _type: 'internationalizedArrayTextValue',
            value: 'A description',
          },
        ],
      },
    }
    const result = getDocumentsToTranslate(doc)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      _type: 'internationalizedArrayTextValue',
      path: ['content', 'description'],
      pathString: 'content.description',
    })
  })

  test('skips underscore-prefixed keys', () => {
    const doc = {
      _id: 'doc1',
      _type: 'article',
      _rev: 'rev1',
      title: [
        {
          _key: 'en',
          _type: 'internationalizedArrayStringValue',
          value: 'Hello',
        },
      ],
    }
    const result = getDocumentsToTranslate(doc)
    // Should only find the title field, not traverse _id, _type, _rev
    expect(result).toHaveLength(1)
    expect(result[0]!.pathString).toBe('title')
  })

  test('finds multiple internationalized arrays in a document', () => {
    const doc = {
      _id: 'doc1',
      _type: 'article',
      title: [
        {
          _key: 'en',
          _type: 'internationalizedArrayStringValue',
          value: 'Hello',
        },
      ],
      description: [
        {
          _key: 'en',
          _type: 'internationalizedArrayTextValue',
          value: 'Description',
        },
      ],
    }
    const result = getDocumentsToTranslate(doc)
    expect(result).toHaveLength(2)
  })

  test('does not match types that only start with internationalizedArray but do not end with Value', () => {
    const doc = {
      _id: 'doc1',
      _type: 'article',
      items: [
        {
          _key: 'en',
          _type: 'internationalizedArrayString',
          value: 'Hello',
        },
      ],
    }
    const result = getDocumentsToTranslate(doc)
    expect(result).toEqual([])
  })

  test('preserves original properties on returned items', () => {
    const doc = {
      _id: 'doc1',
      _type: 'article',
      title: [
        {
          _key: 'en',
          _type: 'internationalizedArrayStringValue',
          value: 'Hello',
          language: 'en',
        },
      ],
    }
    const result = getDocumentsToTranslate(doc)
    expect(result[0]).toMatchObject({
      _key: 'en',
      _type: 'internationalizedArrayStringValue',
      value: 'Hello',
      language: 'en',
    })
  })
})

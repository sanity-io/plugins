import {describe, expect, test} from 'vitest'

import {createReference} from './createReference'

describe('createReference', () => {
  test('creates reference with correct _key from key parameter', () => {
    const result = createReference('en', 'doc-123', 'article')
    expect(result._key).toBe('en')
  })

  test('creates reference with correct _type', () => {
    const result = createReference('en', 'doc-123', 'article')
    expect(result._type).toBe('internationalizedArrayReferenceValue')
  })

  test('creates reference with correct value._ref from ref parameter', () => {
    const result = createReference('en', 'doc-123', 'article')
    expect(result.value._ref).toBe('doc-123')
  })

  test('creates reference with value._type as reference', () => {
    const result = createReference('en', 'doc-123', 'article')
    expect(result.value._type).toBe('reference')
  })

  test('creates reference with _weak: true', () => {
    const result = createReference('en', 'doc-123', 'article')
    expect(result.value._weak).toBe(true)
  })

  test('includes _strengthenOnPublish with type when strengthenOnPublish is true (default)', () => {
    const result = createReference('en', 'doc-123', 'article')
    expect(result.value._strengthenOnPublish).toEqual({type: 'article'})
  })

  test('includes _strengthenOnPublish when explicitly set to true', () => {
    const result = createReference('en', 'doc-123', 'page', true)
    expect(result.value._strengthenOnPublish).toEqual({type: 'page'})
  })

  test('omits _strengthenOnPublish when set to false', () => {
    const result = createReference('en', 'doc-123', 'article', false)
    expect(result.value._strengthenOnPublish).toBeUndefined()
  })

  test('handles different key values', () => {
    const result = createReference('fr-CA', 'doc-456', 'article')
    expect(result._key).toBe('fr-CA')
    expect(result.value._ref).toBe('doc-456')
  })
})

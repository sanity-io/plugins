import {describe, expect, test} from 'vitest'

import {sfccProductPreview} from './product'

describe('sfccProductPreview.prepare', () => {
  test('uses first localized name entry as title', () => {
    const result = sfccProductPreview.prepare({
      name: [{value: 'Blue Sneakers'}, {value: 'Blaue Sneaker'}],
      id: 'SKU-123',
    })
    expect(result.title).toBe('Blue Sneakers')
  })

  test('falls back to id when name is missing', () => {
    const result = sfccProductPreview.prepare({id: 'SKU-456'})
    expect(result.title).toBe('SKU-456')
  })

  test('falls back to "Untitled Product" when both name and id are missing', () => {
    const result = sfccProductPreview.prepare({})
    expect(result.title).toBe('Untitled Product')
  })

  test('includes productType in subtitle for Master products', () => {
    const result = sfccProductPreview.prepare({id: 'P1', productType: 'Master'})
    expect(result.subtitle).toBe('Master')
  })

  test('excludes Variant from subtitle productType', () => {
    const result = sfccProductPreview.prepare({id: 'P1', productType: 'Variant', color: 'Red'})
    expect(result.subtitle).toBe('Color: Red')
  })

  test('maps variation attributes when variationAttributes array is present', () => {
    const result = sfccProductPreview.prepare({
      id: 'P1',
      variationAttributes: ['color', 'size'],
      color: 'Red',
      size: 'L',
      memorySize: '128GB',
    })
    expect(result.subtitle).toBe('Color: Red | Size: L')
  })

  test('skips variation attributes with no value', () => {
    const result = sfccProductPreview.prepare({
      id: 'P1',
      variationAttributes: ['color', 'size'],
      color: 'Red',
    })
    expect(result.subtitle).toBe('Color: Red')
  })

  test('falls back to all non-empty attributes when variationAttributes is absent', () => {
    const result = sfccProductPreview.prepare({
      id: 'P1',
      productType: 'Simple',
      color: 'Blue',
      tvSize: '55"',
    })
    expect(result.subtitle).toBe('Simple | Color: Blue | TV Size: 55"')
  })

  test('joins multiple meta entries with pipe separator', () => {
    const result = sfccProductPreview.prepare({
      id: 'P1',
      productType: 'Master',
      variationAttributes: ['color', 'size'],
      color: 'Green',
      size: 'M',
    })
    expect(result.subtitle).toBe('Master | Color: Green | Size: M')
  })

  test('returns a media element', () => {
    const result = sfccProductPreview.prepare({
      id: 'P1',
      productImage: 'https://example.com/img.jpg',
      isActive: true,
    })
    expect(result.media).toBeTruthy()
  })
})

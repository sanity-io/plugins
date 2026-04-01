import {describe, expect, test} from 'vitest'

import {sfccCategoryPreview} from './category'

describe('sfccCategoryPreview.prepare', () => {
  test('uses title as primary display title', () => {
    const result = sfccCategoryPreview.prepare({title: 'Shoes', name: 'shoes', categoryId: 'cat-1'})
    expect(result.title).toBe('Shoes')
  })

  test('falls back to name when title is missing', () => {
    const result = sfccCategoryPreview.prepare({name: 'shoes', categoryId: 'cat-1'})
    expect(result.title).toBe('shoes')
  })

  test('falls back to displayName when title and name are missing', () => {
    const result = sfccCategoryPreview.prepare({
      displayName: [{value: 'Schuhe'}],
      categoryId: 'cat-1',
    })
    expect(result.title).toBe('Schuhe')
  })

  test('falls back to categoryId when title, name and displayName are missing', () => {
    const result = sfccCategoryPreview.prepare({categoryId: 'cat-42'})
    expect(result.title).toBe('cat-42')
  })

  test('falls back to "Untitled Category" when all title sources are missing', () => {
    const result = sfccCategoryPreview.prepare({})
    expect(result.title).toBe('Untitled Category')
  })

  test('shows parent label in subtitle when parent is not root', () => {
    const result = sfccCategoryPreview.prepare({
      title: 'Boots',
      parentName: 'Footwear',
      parentId: 'cat-2',
    })
    expect(result.subtitle).toBe('Parent: Footwear')
  })

  test('falls back to parentDisplayName for subtitle', () => {
    const result = sfccCategoryPreview.prepare({
      title: 'Boots',
      parentDisplayName: [{value: 'Schuhe'}],
      parentId: 'cat-2',
    })
    expect(result.subtitle).toBe('Parent: Schuhe')
  })

  test('falls back to parentId for subtitle', () => {
    const result = sfccCategoryPreview.prepare({title: 'Boots', parentId: 'cat-parent'})
    expect(result.subtitle).toBe('Parent: cat-parent')
  })

  test('suppresses subtitle when parentId is root', () => {
    const result = sfccCategoryPreview.prepare({
      title: 'Top Level',
      parentName: 'Root',
      parentId: 'root',
    })
    expect(result.subtitle).toBe('')
  })

  test('suppresses subtitle when no parent info exists', () => {
    const result = sfccCategoryPreview.prepare({title: 'Orphan'})
    expect(result.subtitle).toBe('')
  })

  test('returns a media element', () => {
    const result = sfccCategoryPreview.prepare({
      title: 'Shoes',
      imageUrl: 'https://example.com/thumb.jpg',
    })
    expect(result.media).toBeTruthy()
  })
})

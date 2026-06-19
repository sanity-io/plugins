import {describe, expect, it} from 'vitest'

import type {Asset} from '../types'
import {findImageAssets} from './ReplaceImages'

const newAsset = {_id: 'new-asset', _type: 'sanity.imageAsset'} as Asset

describe('findImageAssets', () => {
  it('re-points a top-level image field and returns it keyed by its field', () => {
    const document = {
      _id: 'doc-1',
      _type: 'post',
      hero: {_type: 'image', asset: {_ref: 'old-asset', _type: 'reference'}},
    }

    const result = findImageAssets(document, newAsset, 'old-asset')

    expect(result).toEqual([
      {hero: {_type: 'image', asset: {_ref: 'new-asset', _type: 'reference'}}},
    ])
    // The matched node is mutated in place
    expect(document.hero.asset._ref).toBe('new-asset')
  })

  it('returns an empty array when no image references the asset', () => {
    const document = {
      _id: 'doc-1',
      _type: 'post',
      hero: {_type: 'image', asset: {_ref: 'some-other-asset', _type: 'reference'}},
    }

    expect(findImageAssets(document, newAsset, 'old-asset')).toEqual([])
    expect(document.hero.asset._ref).toBe('some-other-asset')
  })

  it('repoints deeply nested images while preserving the full top-level field (no data loss)', () => {
    const document = {
      _id: 'doc-1',
      _type: 'post',
      content: {
        title: 'Keep me',
        intro: {_type: 'image', asset: {_ref: 'old-asset', _type: 'reference'}},
      },
    }

    const result = findImageAssets(document, newAsset, 'old-asset')

    // The patch sets the entire `content` field, so the sibling `title` is retained
    expect(result).toEqual([
      {
        content: {
          title: 'Keep me',
          intro: {_type: 'image', asset: {_ref: 'new-asset', _type: 'reference'}},
        },
      },
    ])
    expect(document.content.intro.asset._ref).toBe('new-asset')
  })

  it('ignores non-image objects that happen to carry an asset reference', () => {
    const document = {
      _id: 'doc-1',
      _type: 'post',
      file: {_type: 'file', asset: {_ref: 'old-asset', _type: 'reference'}},
    }

    expect(findImageAssets(document, newAsset, 'old-asset')).toEqual([])
    expect(document.file.asset._ref).toBe('old-asset')
  })
})

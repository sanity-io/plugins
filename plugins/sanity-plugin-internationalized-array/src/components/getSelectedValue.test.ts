import {describe, expect, test} from 'vitest'

import {getSelectedValue} from './getSelectedValue'

describe('getSelectedValue', () => {
  test('returns empty object when select is undefined', () => {
    expect(getSelectedValue(undefined, {foo: 'bar'})).toEqual({})
  })

  test('returns empty object when document is undefined', () => {
    expect(getSelectedValue({key: 'path'}, undefined)).toEqual({})
  })

  test('returns empty object when both are undefined', () => {
    expect(getSelectedValue(undefined, undefined)).toEqual({})
  })

  test('extracts values from document using paths', () => {
    const select = {market: 'market', title: 'title'}
    const document = {market: 'us', title: 'Hello', _type: 'post'}
    expect(getSelectedValue(select, document)).toEqual({market: 'us', title: 'Hello'})
  })

  test('handles nested paths via lodash get', () => {
    const select = {nested: 'content.market'}
    const document = {content: {market: 'eu'}, _type: 'post'}
    expect(getSelectedValue(select, document)).toEqual({nested: 'eu'})
  })

  test('filters array references without _ref', () => {
    const select = {refs: 'items'}
    const document = {
      items: [
        {_type: 'reference', _ref: 'doc-1'},
        {_type: 'reference'}, // No _ref, should be filtered
        {_type: 'reference', _ref: 'doc-2'},
      ],
    }
    const result = getSelectedValue(select, document)
    expect(result['refs']).toHaveLength(2)
    expect(result['refs']).toEqual([
      {_type: 'reference', _ref: 'doc-1'},
      {_type: 'reference', _ref: 'doc-2'},
    ])
  })

  test('keeps non-object items in arrays', () => {
    const select = {tags: 'tags'}
    const document = {tags: ['tag1', 'tag2'], _type: 'post'}
    expect(getSelectedValue(select, document)).toEqual({tags: ['tag1', 'tag2']})
  })

  test('returns undefined for paths that do not exist in document', () => {
    const select = {missing: 'nonexistent.path'}
    const document = {title: 'Hello', _type: 'post'}
    expect(getSelectedValue(select, document)).toEqual({missing: undefined})
  })
})

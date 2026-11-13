import {describe, expect, test} from 'vitest'

import {directivesToAttach, withDirectives} from './upload'

describe('directivesToAttach', () => {
  test('attaches every configured directive by default', () => {
    expect(directivesToAttach(['a', 'b'])).toEqual(['a', 'b'])
  })

  test('drops directives Mux does not have and ones unchecked for this upload', () => {
    expect(directivesToAttach(['a', 'b', 'c'], {missingIds: ['b'], uncheckedIds: ['c']})).toEqual([
      'a',
    ])
  })
})

describe('withDirectives', () => {
  const settings = {video_quality: 'plus', input: [{type: 'video'}]}

  test('adds no key at all when nothing is attached', () => {
    const unchanged = withDirectives(settings, [])
    expect(unchanged).toBe(settings)
    expect(unchanged).not.toHaveProperty('directives')
  })

  test('adds the directives as {id} objects', () => {
    expect(withDirectives(settings, ['a', 'b'])).toEqual({
      ...settings,
      directives: [{id: 'a'}, {id: 'b'}],
    })
  })
})

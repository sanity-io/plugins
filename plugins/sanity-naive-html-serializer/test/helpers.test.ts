import {expect, test} from 'vitest'

import {getValidFields} from './helpers'

test('getValidFields returns an array of field names', () => {
  const fields = getValidFields({
    _type: 'example',
    _key: 'a1',
    title: 'Hello',
    description: 'World',
  })

  expect(Array.isArray(fields)).toBe(true)
  expect(fields.sort()).toEqual(['description', 'title'])
})

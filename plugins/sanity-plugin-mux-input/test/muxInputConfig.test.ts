import {describe, expect, test} from 'vitest'

import {muxInput} from '../src/_exports'

describe('muxInput muxApiHost', () => {
  test('rejects an empty value at startup', () => {
    expect(() => muxInput({muxApiHost: ''})).toThrow(/absolute URL/)
  })

  test('rejects an invalid value at startup', () => {
    expect(() => muxInput({muxApiHost: '127.0.0.1:8080'})).toThrow(/absolute URL/)
  })

  test('accepts a valid value and an unset value', () => {
    expect(() => muxInput({muxApiHost: 'http://127.0.0.1:8080/'})).not.toThrow()
    expect(() => muxInput()).not.toThrow()
  })
})

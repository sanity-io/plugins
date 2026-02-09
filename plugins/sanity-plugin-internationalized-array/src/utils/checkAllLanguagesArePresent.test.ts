import {describe, expect, test} from 'vitest'

import {MOCK_LANGUAGES, createValues} from '../test/helpers'
import {checkAllLanguagesArePresent} from './checkAllLanguagesArePresent'

describe('checkAllLanguagesArePresent', () => {
  test('returns true when all languages have matching values', () => {
    const languages = MOCK_LANGUAGES.slice(0, 2) // en, fr
    const value = createValues(['en', 'fr'])
    expect(checkAllLanguagesArePresent(languages, value)).toBe(true)
  })

  test('returns false when a language is missing from values', () => {
    const languages = MOCK_LANGUAGES.slice(0, 3) // en, fr, es
    const value = createValues(['en', 'fr'])
    expect(checkAllLanguagesArePresent(languages, value)).toBe(false)
  })

  test('returns false when value is undefined', () => {
    const languages = MOCK_LANGUAGES.slice(0, 2)
    expect(checkAllLanguagesArePresent(languages, undefined)).toBe(false)
  })

  test('returns false when values has extra items not in languages', () => {
    const languages = MOCK_LANGUAGES.slice(0, 1) // en only
    const value = createValues(['en', 'fr'])
    expect(checkAllLanguagesArePresent(languages, value)).toBe(false)
  })

  test('returns true when both arrays are empty', () => {
    expect(checkAllLanguagesArePresent([], [])).toBe(true)
  })

  test('returns true when languages are empty and value is undefined', () => {
    expect(checkAllLanguagesArePresent([], undefined)).toBe(true)
  })

  test('returns false when values exist but languages is empty', () => {
    const value = createValues(['en'])
    expect(checkAllLanguagesArePresent([], value)).toBe(false)
  })

  test('handles values in different order than languages', () => {
    const languages = MOCK_LANGUAGES.slice(0, 3) // en, fr, es
    const value = createValues(['es', 'en', 'fr'])
    expect(checkAllLanguagesArePresent(languages, value)).toBe(true)
  })

  test('returns false when values contain duplicates that match languages count', () => {
    const languages = MOCK_LANGUAGES.slice(0, 2) // en, fr
    const value = createValues(['en', 'en']) // duplicate and missing fr
    expect(checkAllLanguagesArePresent(languages, value)).toBe(false)
  })
})

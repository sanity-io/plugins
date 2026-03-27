import {describe, expect, it} from 'vitest'

import {getSelectableLanguages} from './getSelectableLanguages'

const supportedLanguages = [
  {id: 'en', title: 'English'},
  {id: 'es', title: 'Spanish'},
  {id: 'fr', title: 'French'},
]

describe('getSelectableLanguages', () => {
  it('returns all supported languages when defaultLanguages is undefined', () => {
    const expected = supportedLanguages // No default languages are excluded.

    expect(
      getSelectableLanguages({
        supportedLanguages,
      }),
    ).toEqual(expected)
  })

  it('returns all supported languages when defaultLanguages is empty', () => {
    const expected = supportedLanguages // Empty defaults means no filtering.

    expect(
      getSelectableLanguages({
        supportedLanguages,
        defaultLanguages: [],
      }),
    ).toEqual(expected)
  })

  it('filters out languages listed in defaultLanguages', () => {
    const expected = [{id: 'es', title: 'Spanish'}] // "en" and "fr" are defaults and filtered out.

    expect(
      getSelectableLanguages({
        supportedLanguages,
        defaultLanguages: ['en', 'fr'],
      }),
    ).toEqual(expected)
  })

  it('ignores default language ids that are not in supportedLanguages', () => {
    const expected = supportedLanguages // Unknown default ids do not affect supported languages.

    expect(
      getSelectableLanguages({
        supportedLanguages,
        defaultLanguages: ['de'],
      }),
    ).toEqual(expected)
  })

  it('returns an empty array when no supported languages are provided', () => {
    const expected: [] = [] // No supported languages means nothing can be selectable.

    expect(
      getSelectableLanguages({
        supportedLanguages: [],
        defaultLanguages: ['en'],
      }),
    ).toEqual(expected)
  })
})

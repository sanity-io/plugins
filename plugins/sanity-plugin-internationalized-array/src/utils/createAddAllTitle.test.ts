import {describe, expect, test} from 'vitest'

import {MOCK_LANGUAGES, createValues} from '../test/helpers'
import {createAddAllTitle} from './createAddAllTitle'

describe('createAddAllTitle', () => {
  test('returns "Add all languages" when no value and multiple languages', () => {
    expect(createAddAllTitle(undefined, MOCK_LANGUAGES)).toBe('Add all languages')
  })

  test('returns "Add {title} Field" when no value and single language', () => {
    expect(createAddAllTitle(undefined, [MOCK_LANGUAGES[0]!])).toBe('Add English Field')
  })

  test('returns "Add missing languages" (plural) when multiple languages missing', () => {
    const value = createValues(['en'])
    // 4 languages - 1 value = 3 missing
    expect(createAddAllTitle(value, MOCK_LANGUAGES)).toBe('Add missing languages')
  })

  test('returns "Add missing language" (singular) when one language missing', () => {
    const languages = MOCK_LANGUAGES.slice(0, 2) // en, fr
    const value = createValues(['en'])
    // 2 languages - 1 value = 1 missing
    expect(createAddAllTitle(value, languages)).toBe('Add missing language')
  })

  test('returns "Add all languages" for empty languages array with no value', () => {
    expect(createAddAllTitle(undefined, [])).toBe('Add all languages')
  })
})

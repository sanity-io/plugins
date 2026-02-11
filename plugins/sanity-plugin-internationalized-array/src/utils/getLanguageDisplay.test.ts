import {describe, expect, test} from 'vitest'

import {getLanguageDisplay} from './getLanguageDisplay'

describe('getLanguageDisplay', () => {
  test('codeOnly returns uppercase code', () => {
    expect(getLanguageDisplay('codeOnly', 'English', 'en')).toBe('EN')
  })

  test('titleOnly returns title as-is', () => {
    expect(getLanguageDisplay('titleOnly', 'English', 'en')).toBe('English')
  })

  test('titleAndCode returns "Title (CODE)" format', () => {
    expect(getLanguageDisplay('titleAndCode', 'English', 'en')).toBe('English (EN)')
  })

  test('fallback returns title for unknown display type', () => {
    // @ts-expect-error - testing fallback with invalid type
    expect(getLanguageDisplay('unknown', 'English', 'en')).toBe('English')
  })

  test('handles multi-word titles and codes', () => {
    expect(getLanguageDisplay('titleAndCode', 'Brazilian Portuguese', 'pt-br')).toBe(
      'Brazilian Portuguese (PT-BR)',
    )
  })
})

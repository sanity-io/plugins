import {describe, expect, test} from 'vitest'

import {createFieldName, pascalCase} from './createFieldName'

describe('pascalCase', () => {
  test('converts lowercase to PascalCase', () => {
    expect(pascalCase('title')).toBe('Title')
  })

  test('converts kebab-case to PascalCase', () => {
    expect(pascalCase('my-field')).toBe('MyField')
  })

  test('converts snake_case to PascalCase', () => {
    expect(pascalCase('my_field')).toBe('MyField')
  })

  test('converts camelCase to PascalCase', () => {
    expect(pascalCase('myField')).toBe('MyField')
  })
})

describe('createFieldName', () => {
  test('creates array name without value suffix', () => {
    expect(createFieldName('string')).toBe('internationalizedArrayString')
  })

  test('creates object name with value suffix', () => {
    expect(createFieldName('string', true)).toBe('internationalizedArrayStringValue')
  })

  test('handles complex type names', () => {
    expect(createFieldName('block-content')).toBe('internationalizedArrayBlockContent')
    expect(createFieldName('block-content', true)).toBe('internationalizedArrayBlockContentValue')
  })

  test('handles single character names', () => {
    expect(createFieldName('a')).toBe('internationalizedArrayA')
    expect(createFieldName('a', true)).toBe('internationalizedArrayAValue')
  })
})

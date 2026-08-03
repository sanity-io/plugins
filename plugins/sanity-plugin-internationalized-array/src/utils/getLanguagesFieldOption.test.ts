/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import type {SchemaType} from 'sanity'
import {describe, expect, test} from 'vitest'

import {MOCK_LANGUAGES} from '../test/helpers'
import {getLanguagesFieldOption} from './getLanguagesFieldOption'

describe('getLanguagesFieldOption', () => {
  test('returns undefined when schemaType is missing', () => {
    expect(getLanguagesFieldOption(undefined)).toBeUndefined()
  })

  test('returns languages from options on the schema type', () => {
    const schemaType = {
      name: 'internationalizedArrayString',
      options: {languages: MOCK_LANGUAGES},
    } as unknown as SchemaType

    expect(getLanguagesFieldOption(schemaType)).toEqual(MOCK_LANGUAGES)
  })

  test('walks parent type chain until languages options are found', () => {
    const parent = {
      name: 'internationalizedArrayString',
      options: {languages: MOCK_LANGUAGES.slice(0, 2)},
    }
    const schemaType = {
      name: 'title',
      type: parent,
    } as unknown as SchemaType

    expect(getLanguagesFieldOption(schemaType)).toEqual(MOCK_LANGUAGES.slice(0, 2))
  })

  test('returns undefined when no languages option exists in the chain', () => {
    const schemaType = {
      name: 'title',
      type: {name: 'string'},
    } as unknown as SchemaType

    expect(getLanguagesFieldOption(schemaType)).toBeUndefined()
  })
})

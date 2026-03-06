import {createSchema, defineField, defineType, type ObjectSchemaType} from 'sanity'
import {describe, expect, test} from 'vitest'

import {internationalizedArrayLanguageFilter} from './internationalizedArrayLanguageFilter'

const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'internationalizedArrayStringValue',
      type: 'object',
      fields: [defineField({name: 'value', type: 'string'})],
    }),
    defineType({
      name: 'plainObject',
      type: 'object',
      fields: [defineField({name: 'value', type: 'string'})],
    }),
  ],
})

function getSchemaType(name: string): ObjectSchemaType {
  const schemaType = schema.get(name)
  if (!schemaType || schemaType.jsonType !== 'object') {
    throw new Error(`Expected object schema type: ${name}`)
  }

  return schemaType
}

describe('internationalizedArrayLanguageFilter', () => {
  const internationalizedType = getSchemaType('internationalizedArrayStringValue')
  const nonInternationalizedType = getSchemaType('plainObject')
  const languages = [
    {id: 'en', title: 'English'},
    {id: 'fr', title: 'French'},
    {id: 'es', title: 'Spanish'},
  ]
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- `_member` is unused by this filter.
  const member = {} as Parameters<typeof internationalizedArrayLanguageFilter>[1]

  function runFilter(
    enclosingType: ObjectSchemaType,
    selectedLanguageIds: string[],
    parentValue: Record<string, unknown>,
    allLanguages = languages,
  ) {
    return internationalizedArrayLanguageFilter(
      enclosingType,
      member,
      selectedLanguageIds,
      parentValue,
      allLanguages,
    )
  }

  test('matches selected language using language field', () => {
    const result = runFilter(internationalizedType, ['en'], {language: 'en'})

    expect(result).toBe(true)
  })

  test('falls back to _key for pre-migration items', () => {
    const result = runFilter(internationalizedType, ['fr'], {_key: 'fr'})

    expect(result).toBe(true)
  })

  test('prefers language over _key when both are present', () => {
    const result = runFilter(internationalizedType, ['fr'], {language: 'en', _key: 'fr'})

    expect(result).toBe(false)
  })

  test('returns false when neither language nor _key matches', () => {
    const result = runFilter(internationalizedType, ['es'], {_key: 'en'})

    expect(result).toBe(false)
  })

  test('returns false when language key is missing', () => {
    const result = runFilter(internationalizedType, ['en'], {})

    expect(result).toBe(false)
  })

  test('returns true when item language is not in configured languages', () => {
    const result = runFilter(internationalizedType, ['en'], {language: 'it'})

    expect(result).toBe(true)
  })

  test('always returns true for non-internationalized item types', () => {
    const result = runFilter(nonInternationalizedType, ['en'], {language: 'fr'})

    expect(result).toBe(true)
  })
})

import {
  createSchema,
  defineArrayMember,
  defineField,
  defineType,
  type ObjectSchemaType,
} from 'sanity'
import {describe, expect, test} from 'vitest'

import {hasInternationalizedArrayField} from './hasInternationalizedArrayField'

const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'internationalizedArrayString',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineType({
      name: 'internationalizedArrayText',
      type: 'array',
      of: [defineArrayMember({type: 'text'})],
    }),
    defineType({
      name: 'internationalizedArrayBlockContent',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineType({
      name: 'internationalizedArrayReference',
      type: 'object',
      fields: [
        defineField({name: 'value', type: 'reference', to: [{type: 'articleArrayItemType'}]}),
      ],
    }),
    defineType({
      name: 'seoWithI18n',
      type: 'object',
      fields: [defineField({name: 'description', type: 'internationalizedArrayText'})],
    }),
    defineType({
      name: 'seoPlain',
      type: 'object',
      fields: [defineField({name: 'description', type: 'text'})],
    }),
    defineType({
      name: 'level3',
      type: 'object',
      fields: [defineField({name: 'deepField', type: 'internationalizedArrayString'})],
    }),
    defineType({
      name: 'level2',
      type: 'object',
      fields: [defineField({name: 'level3', type: 'level3'})],
    }),
    defineType({
      name: 'level1',
      type: 'object',
      fields: [defineField({name: 'level2', type: 'level2'})],
    }),
    defineType({
      name: 'articleDirectField',
      type: 'document',
      fields: [defineField({name: 'title', type: 'internationalizedArrayString'})],
    }),
    defineType({
      name: 'articleNestedObject',
      type: 'document',
      fields: [defineField({name: 'seo', type: 'seoWithI18n'})],
    }),
    defineType({
      name: 'articleArrayItemType',
      type: 'document',
      fields: [
        defineField({
          name: 'content',
          type: 'array',
          of: [defineArrayMember({type: 'internationalizedArrayReference'})],
        }),
      ],
    }),
    defineType({
      name: 'articleArrayObjectField',
      type: 'document',
      fields: [
        defineField({
          name: 'sections',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'section',
              fields: [
                defineField({name: 'heading', type: 'string'}),
                defineField({name: 'body', type: 'internationalizedArrayBlockContent'}),
              ],
            }),
          ],
        }),
      ],
    }),
    defineType({
      name: 'articleWithoutMatches',
      type: 'document',
      fields: [
        defineField({name: 'title', type: 'string'}),
        defineField({name: 'seo', type: 'seoPlain'}),
        defineField({
          name: 'sections',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'section',
              fields: [defineField({name: 'body', type: 'text'})],
            }),
          ],
        }),
      ],
    }),
    defineType({
      name: 'articleDeepNested',
      type: 'document',
      fields: [defineField({name: 'level1', type: 'level1'})],
    }),
    defineType({
      name: 'plainObject',
      type: 'object',
      fields: [defineField({name: 'description', type: 'text'})],
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

describe('hasInternationalizedArrayField', () => {
  test('returns false for non-document schema types', () => {
    const schemaType = getSchemaType('plainObject')
    expect(hasInternationalizedArrayField(schemaType)).toBe(false)
  })

  test('returns true for direct internationalized array fields', () => {
    const schemaType = getSchemaType('articleDirectField')
    expect(hasInternationalizedArrayField(schemaType)).toBe(true)
  })

  test('returns true for nested object fields', () => {
    const schemaType = getSchemaType('articleNestedObject')
    expect(hasInternationalizedArrayField(schemaType)).toBe(true)
  })

  test('returns true for direct array item type matches', () => {
    const schemaType = getSchemaType('articleArrayItemType')
    expect(hasInternationalizedArrayField(schemaType)).toBe(true)
  })

  test('returns true for nested fields inside array object items', () => {
    const schemaType = getSchemaType('articleArrayObjectField')
    expect(hasInternationalizedArrayField(schemaType)).toBe(true)
  })

  test('returns false when no matching field types exist', () => {
    const schemaType = getSchemaType('articleWithoutMatches')
    expect(hasInternationalizedArrayField(schemaType)).toBe(false)
  })

  test('finds deeply nested matches', () => {
    const schemaType = getSchemaType('articleDeepNested')
    expect(hasInternationalizedArrayField(schemaType)).toBe(true)
  })
})

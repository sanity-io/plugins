import {describe, expect, test, vi} from 'vitest'

import {LANGUAGE_FIELD_NAME} from '../constants'

// Mock the React component to avoid transitive import issues
vi.mock('../components/InternationalizedInput', () => ({
  default: () => null,
}))

import objectFactory from './object'

describe('object schema factory', () => {
  test('generates correct object name with Value suffix', () => {
    const schema = objectFactory({type: 'string'})
    expect(schema.name).toBe('internationalizedArrayStringValue')
  })

  test('generates correct title', () => {
    const schema = objectFactory({type: 'string'})
    expect(schema.title).toBe('Internationalized array string')
  })

  test('sets type to object', () => {
    const schema = objectFactory({type: 'string'})
    expect(schema.type).toBe('object')
  })

  test('includes a "value" and "language" fields', () => {
    const schema = objectFactory({type: 'string'})
    const fields = schema.fields
    expect(fields).toHaveLength(2)
    expect(fields[0]!.name).toBe('value')
    expect(fields[1]!.name).toBe('language')
  })

  test('value field inherits the configured type for string types', () => {
    const schema = objectFactory({type: 'string'})
    const fields = schema.fields
    expect(fields[0]!.type).toBe('string')
  })

  test('preview subtitle uses LANGUAGE_FIELD_NAME', () => {
    const schema = objectFactory({type: 'string'})
    expect(schema.preview?.select?.subtitle).toBe(LANGUAGE_FIELD_NAME)
  })

  test('preview title maps to value field', () => {
    const schema = objectFactory({type: 'string'})
    expect(schema.preview?.select?.title).toBe('value')
  })

  test('handles FieldDefinition type input', () => {
    const schema = objectFactory({
      type: {name: 'customType', type: 'string'},
    })
    expect(schema.name).toBe('internationalizedArrayCustomTypeValue')
  })

  test('spreads FieldDefinition properties onto value field', () => {
    const schema = objectFactory({
      type: {
        name: 'featuredProduct',
        type: 'reference',
        to: [{type: 'product'}],
      },
    })
    const fields = schema.fields
    expect(fields[0]!.name).toBe('value')
    // @ts-expect-error - to is not properly inherited from the FieldDefinition
    expect(fields[0]!.to).toEqual([{type: 'product'}])
  })
})

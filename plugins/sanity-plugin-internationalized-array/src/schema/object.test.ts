import {describe, expect, test, vi} from 'vitest'

import {LANGUAGE_FIELD_NAME} from '../constants'

// Mock the React component to avoid transitive import issues
vi.mock('../components/InternationalizedInput', () => ({
  default: () => null,
}))

import type {FieldDefinition} from 'sanity'

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

  test('includes a single "value" field', () => {
    const schema = objectFactory({type: 'string'})
    const fields = schema.fields
    expect(fields).toHaveLength(1)
    expect(fields[0]!.name).toBe('value')
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

  test('sets object field renderer level to 0', () => {
    const schema = objectFactory({type: 'string'})
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const fieldComponent = schema.components?.field as
      | ((props: Record<string, unknown>) => unknown)
      | undefined
    expect(fieldComponent).toBeTypeOf('function')

    const renderDefault = vi.fn((props: Record<string, unknown>) => props)
    const props = {title: 'Wrapper', level: 3, renderDefault}

    fieldComponent?.(props)
    expect(renderDefault).toHaveBeenCalledWith(
      expect.objectContaining({level: 0, title: 'Wrapper'}),
    )
  })

  test('value field renderer always hides title', () => {
    const schema = objectFactory({type: 'string'})
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const valueField = schema.fields?.[0] as FieldDefinition<'string'>
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const fieldComponent = valueField?.components?.field as (
      props: Record<string, unknown>,
    ) => unknown
    expect(fieldComponent).toBeTypeOf('function')

    const renderDefault = vi.fn((props: Record<string, unknown>) => props)
    const props = {title: 'Value', renderDefault}

    fieldComponent?.(props)
    expect(renderDefault).toHaveBeenCalledWith(expect.objectContaining({title: ''}))
  })
})

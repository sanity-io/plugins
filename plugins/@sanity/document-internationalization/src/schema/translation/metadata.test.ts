/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import type {FieldDefinition} from 'sanity'

import {LANGUAGE_FIELD_NAME} from 'sanity-plugin-internationalized-array'
import {describe, expect, test} from 'vitest'

import {METADATA_SCHEMA_NAME, TRANSLATIONS_ARRAY_NAME} from '../../constants'
import createMetadataSchema from './metadata'

describe('metadata schema', () => {
  const schemaTypes = ['article', 'page']

  test('creates schema with correct type name', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    expect(schema.name).toBe(METADATA_SCHEMA_NAME)
    expect(schema.name).toBe('translation.metadata')
  })

  test('creates document type schema', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    expect(schema.type).toBe('document')
  })

  test('has correct title', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    expect(schema.title).toBe('Translation metadata')
  })

  test('includes translations field with internationalizedArrayReference type', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    const translationsField = schema.fields?.find((f) => f.name === TRANSLATIONS_ARRAY_NAME)
    expect(translationsField).toBeDefined()
    expect(translationsField?.type).toBe('internationalizedArrayReference')
  })

  test('includes schemaTypes field', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    const schemaTypesField = schema.fields?.find((f) => f.name === 'schemaTypes')
    expect(schemaTypesField).toBeDefined()
    expect(schemaTypesField?.type).toBe('array')
  })

  test('schemaTypes field has list options from parameter', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    const schemaTypesField = schema.fields?.find((f) => f.name === 'schemaTypes')
    expect(schemaTypesField?.options).toEqual({list: schemaTypes})
  })

  test('schemaTypes field has readOnly function that returns true when value is truthy', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    const schemaTypesField = schema.fields?.find((f) => f.name === 'schemaTypes')
    expect(typeof schemaTypesField?.readOnly).toBe('function')

    // Test the readOnly function - uses Boolean(value) so empty array is truthy
    const readOnlyFn = schemaTypesField?.readOnly as (opts: {value: unknown}) => boolean
    expect(readOnlyFn({value: ['article']})).toBe(true)
    expect(readOnlyFn({value: []})).toBe(true) // Empty array is truthy in Boolean()
    expect(readOnlyFn({value: null})).toBe(false)
    expect(readOnlyFn({value: undefined})).toBe(false)
  })

  test('accepts additional metadata fields parameter', () => {
    const customField: FieldDefinition = {
      name: 'customMeta',
      type: 'string',
      title: 'Custom Metadata',
    }
    const schema = createMetadataSchema(schemaTypes, [customField])

    const customMetaField = schema.fields?.find((f) => f.name === 'customMeta')
    expect(customMetaField).toBeDefined()
    expect(customMetaField?.type).toBe('string')
  })

  test('places custom fields after built-in fields', () => {
    const customField: FieldDefinition = {
      name: 'customMeta',
      type: 'string',
    }
    const schema = createMetadataSchema(schemaTypes, [customField])

    const fieldNames = schema.fields?.map((f) => f.name)
    expect(fieldNames).toEqual([TRANSLATIONS_ARRAY_NAME, 'schemaTypes', 'customMeta'])
  })

  test('enables liveEdit', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    expect(schema.liveEdit).toBe(true)
  })

  test('uses TranslateIcon', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    expect(schema.icon).toBeDefined()
  })

  test('has preview configuration', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    expect(schema.preview).toBeDefined()
    expect(schema.preview?.select).toEqual({
      translations: TRANSLATIONS_ARRAY_NAME,
      documentSchemaTypes: 'schemaTypes',
    })
  })

  test('preview title shows singular for 1 translation', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    const result = schema.preview?.prepare?.({
      translations: [{[LANGUAGE_FIELD_NAME]: 'en'}],
      documentSchemaTypes: [],
    })

    expect(result?.title).toBe('1 Translation')
  })

  test('preview title shows plural for multiple translations', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    const result = schema.preview?.prepare?.({
      translations: [
        {[LANGUAGE_FIELD_NAME]: 'en'},
        {[LANGUAGE_FIELD_NAME]: 'fr'},
        {[LANGUAGE_FIELD_NAME]: 'es'},
      ],
      documentSchemaTypes: [],
    })

    expect(result?.title).toBe('3 Translations')
  })

  test('preview title shows 0 translations when empty', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    const result = schema.preview?.prepare?.({
      translations: [],
      documentSchemaTypes: [],
    })

    expect(result?.title).toBe('0 Translations')
  })

  test('preview subtitle shows uppercase language codes', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    const result = schema.preview?.prepare?.({
      translations: [{[LANGUAGE_FIELD_NAME]: 'en'}, {[LANGUAGE_FIELD_NAME]: 'fr'}],
      documentSchemaTypes: [],
    })

    expect(result?.subtitle).toBe('(EN, FR)')
  })

  test('preview subtitle includes schema types', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    const result = schema.preview?.prepare?.({
      translations: [{[LANGUAGE_FIELD_NAME]: 'en'}],
      documentSchemaTypes: ['article', 'page'],
    })

    expect(result?.subtitle).toBe('(EN) article, page')
  })

  test('preview handles undefined translations gracefully', () => {
    const schema = createMetadataSchema(schemaTypes, [])

    const result = schema.preview?.prepare?.({
      translations: undefined,
      documentSchemaTypes: undefined,
    })

    expect(result?.title).toBe('0 Translations')
    expect(result?.subtitle).toBe('')
  })
})

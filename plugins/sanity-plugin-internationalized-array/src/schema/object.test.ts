import type {FieldDefinition} from 'sanity'

import {describe, expect, it} from 'vitest'

import createObjectSchema from './object'

// Runtime type that includes fields property
type ObjectSchemaWithFields = FieldDefinition<'object'> & {
  fields: Array<{name: string; title?: string; options?: Record<string, unknown>}>
}

// Type guard to check if schema has fields
function hasFields(schema: unknown): schema is ObjectSchemaWithFields {
  return (
    schema !== null &&
    typeof schema === 'object' &&
    'fields' in schema &&
    Array.isArray((schema as {fields: unknown}).fields)
  )
}

/**
 * Tests for schema/object.ts
 *
 * This file tests the object schema creation that uses _key in preview configuration.
 * When migrating to sanity_language, these tests should catch breakages in:
 * - Preview subtitle configuration (currently uses '_key')
 */

describe('schema/object', () => {
  describe('createObjectSchema', () => {
    it('creates object schema with correct structure', () => {
      const schema = createObjectSchema({
        type: 'string',
      })

      expect(schema.type).toBe('object')
      expect(schema.name).toBe('internationalizedArrayStringValue')
      expect(schema.title).toBe('Internationalized array string')
    })

    it('creates object schema from FieldDefinition', () => {
      const schema = createObjectSchema({
        type: {
          name: 'customField',
          type: 'object',
          fields: [],
        },
      })

      expect(schema.name).toBe('internationalizedArrayCustomFieldValue')
    })

    it('includes value field', () => {
      const schema = createObjectSchema({
        type: 'string',
      })

      if (!hasFields(schema)) {
        throw new Error('Expected schema to have fields')
      }

      expect(schema.fields).toHaveLength(1)
      expect(schema.fields[0]!.name).toBe('value')
    })

    it('preserves field definition options', () => {
      const schema = createObjectSchema({
        type: {
          name: 'myField',
          type: 'string',
          title: 'My Custom Title',
          options: {customOption: true},
        },
      })

      if (!hasFields(schema)) {
        throw new Error('Expected schema to have fields')
      }

      const valueField = schema.fields[0]!
      expect(valueField.name).toBe('value')
      expect(valueField.title).toBe('My Custom Title')
      expect(valueField.options).toEqual({customOption: true})
    })
  })

  describe('preview configuration - uses _key', () => {
    it('configures preview with _key as subtitle', () => {
      const schema = createObjectSchema({
        type: 'string',
      })

      // This is the key test for _key usage - preview displays _key as subtitle
      expect(schema.preview).toBeDefined()
      expect(schema.preview?.select).toEqual({
        title: 'value',
        subtitle: '_key', // This will become 'sanity_language' after migration
      })
    })

    it('preview select uses _key field for language display', () => {
      // The subtitle: '_key' means the preview will show the language code
      // This is critical for the migration as it affects how items are displayed
      const schema = createObjectSchema({
        type: 'string',
      })

      const {select} = schema.preview || {}
      expect(select?.['subtitle']).toBe('_key')
    })
  })

  describe('components configuration', () => {
    it('assigns InternationalizedInput as item component', () => {
      const schema = createObjectSchema({
        type: 'string',
      })

      expect(schema.components).toBeDefined()
      expect(schema.components?.item).toBeDefined()
    })
  })
})

import type {FieldDefinition} from 'sanity'
import {describe, expect, test} from 'vitest'

import {LINK_FIELD_TYPE} from './constants'
import {linkField} from './index'

function getFields(result: ReturnType<typeof linkField>): FieldDefinition[] {
  const typeDef = result.types[0]
  if (!typeDef || !('fields' in typeDef) || !typeDef.fields) {
    throw new Error('Expected an object type definition with fields')
  }
  return typeDef.fields
}

function getField(fields: FieldDefinition[], name: string): FieldDefinition {
  const field = fields.find((entry) => entry.name === name)
  if (!field) {
    throw new Error(`Field "${name}" not found`)
  }
  return field
}

function evaluateHidden(field: FieldDefinition, parent: Record<string, unknown>): unknown {
  if (typeof field.hidden === 'function') {
    return field.hidden({
      parent,
      document: {_id: 'test', _type: 'test', _createdAt: '', _updatedAt: '', _rev: ''},
      currentUser: null,
      value: undefined,
      path: [],
    })
  }
  return field.hidden
}

describe('linkField', () => {
  test('returns a PresetResult with one type named core.presets.link', () => {
    const result = linkField()

    expect(result.types).toHaveLength(1)
    expect(result.types[0]?.name).toBe(LINK_FIELD_TYPE)
  })

  test('type is an object with 4 fields', () => {
    const fields = getFields(linkField())

    expect(fields).toHaveLength(4)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['type', 'reference', 'url', 'openInNewTab'])
  })

  test('defaults reference targets to document when no internalTypes given', () => {
    const fields = getFields(linkField())
    const referenceField = getField(fields, 'reference')

    expect(referenceField).toHaveProperty('to', [{type: 'document'}])
  })

  test('maps custom internalTypes to reference targets', () => {
    const fields = getFields(linkField({internalTypes: ['page', 'post']}))
    const referenceField = getField(fields, 'reference')

    expect(referenceField).toHaveProperty('to', [{type: 'page'}, {type: 'post'}])
  })

  test('hidden callbacks show correct fields for internal type', () => {
    const fields = getFields(linkField())
    const internalParent = {type: 'internal'}

    expect(evaluateHidden(getField(fields, 'reference'), internalParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'url'), internalParent)).toBe(true)
    expect(evaluateHidden(getField(fields, 'openInNewTab'), internalParent)).toBe(true)
  })

  test('hidden callbacks show correct fields for external type', () => {
    const fields = getFields(linkField())
    const externalParent = {type: 'external'}

    expect(evaluateHidden(getField(fields, 'reference'), externalParent)).toBe(true)
    expect(evaluateHidden(getField(fields, 'url'), externalParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'openInNewTab'), externalParent)).toBe(false)
  })
})

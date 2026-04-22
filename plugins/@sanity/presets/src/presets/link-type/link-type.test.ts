import type {FieldDefinition, PreviewValue} from 'sanity'
import {defineField} from 'sanity'
import {describe, expect, test} from 'vitest'

import type {RegistryContext} from '../../definePresetType'
import {linkType} from './index'

const stubRegistry: RegistryContext = {
  getPreset: () => defineField({name: 'stub', type: 'object', fields: []}),
}
const defaultConfig = {internalTypes: ['page']}

function getFields(result: ReturnType<typeof linkType>): FieldDefinition[] {
  const typeDef = result.type
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

function callPrepare(
  result: ReturnType<typeof linkType>,
  selection: Record<string, unknown>,
): PreviewValue {
  const typeDef = result.type
  const prepare = typeDef && 'preview' in typeDef ? typeDef.preview?.prepare : undefined
  if (!prepare) throw new Error('Expected preview.prepare on type definition')

  return prepare(selection)
}

describe('linkType', () => {
  test('returns a result with type named link', () => {
    const result = linkType(defaultConfig, stubRegistry)

    expect(result.type.name).toBe('link')
  })

  test('type is an object with 4 fields', () => {
    const fields = getFields(linkType(defaultConfig, stubRegistry))

    expect(fields).toHaveLength(4)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['linkType', 'reference', 'url', 'openInNewTab'])
  })

  test('maps internalTypes to reference targets', () => {
    const fields = getFields(linkType({internalTypes: ['page', 'post']}, stubRegistry))
    const referenceField = getField(fields, 'reference')

    expect(referenceField).toHaveProperty('to', [{type: 'page'}, {type: 'post'}])
  })

  test('hidden callbacks show correct fields for internal type', () => {
    const fields = getFields(linkType(defaultConfig, stubRegistry))
    const internalParent = {linkType: 'internal'}

    expect(evaluateHidden(getField(fields, 'reference'), internalParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'url'), internalParent)).toBe(true)
    expect(evaluateHidden(getField(fields, 'openInNewTab'), internalParent)).toBe(true)
  })

  test('hidden callbacks show correct fields for external type', () => {
    const fields = getFields(linkType(defaultConfig, stubRegistry))
    const externalParent = {linkType: 'external'}

    expect(evaluateHidden(getField(fields, 'reference'), externalParent)).toBe(true)
    expect(evaluateHidden(getField(fields, 'url'), externalParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'openInNewTab'), externalParent)).toBe(false)
  })

  test('hidden callbacks show conditional fields when linkType is undefined', () => {
    const fields = getFields(linkType(defaultConfig, stubRegistry))
    const emptyParent = {linkType: undefined}

    expect(evaluateHidden(getField(fields, 'reference'), emptyParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'url'), emptyParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'openInNewTab'), emptyParent)).toBe(false)
  })
})

describe('linkType preview.select', () => {
  test('selects correct paths for preview', () => {
    const typeDef = linkType(defaultConfig, stubRegistry).type
    const select = typeDef && 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      linkType: 'linkType',
      url: 'url',
      referenceTitle: 'reference.title',
    })
  })
})

describe('linkType preview.prepare', () => {
  const preset = linkType(defaultConfig, stubRegistry)

  test('internal link with a reference title', () => {
    const result = callPrepare(preset, {
      linkType: 'internal',
      referenceTitle: 'About Us',
      url: undefined,
    })

    expect(result).toEqual({title: 'About Us', subtitle: 'Internal link'})
  })

  test('internal link without reference title shows fallback', () => {
    const result = callPrepare(preset, {
      linkType: 'internal',
      referenceTitle: undefined,
      url: undefined,
    })

    expect(result).toEqual({title: 'No reference', subtitle: 'Internal link'})
  })

  test('external link with a URL', () => {
    const result = callPrepare(preset, {
      linkType: 'external',
      url: 'https://example.com',
      referenceTitle: undefined,
    })

    expect(result).toEqual({title: 'https://example.com', subtitle: 'External link'})
  })

  test('external link without URL shows fallback', () => {
    const result = callPrepare(preset, {
      linkType: 'external',
      url: undefined,
      referenceTitle: undefined,
    })

    expect(result).toEqual({title: 'No URL', subtitle: 'External link'})
  })

  test('undefined linkType defaults to internal link fallback', () => {
    const result = callPrepare(preset, {
      linkType: undefined,
      url: undefined,
      referenceTitle: undefined,
    })

    expect(result).toEqual({title: 'No reference', subtitle: 'Internal link'})
  })
})

import type {FieldDefinition, PreviewValue} from 'sanity'
import {describe, expect, test} from 'vitest'

import {LINK_FIELD_TYPE} from './constants'
import {linkField} from './index'

const defaultConfig = {internalTypes: ['page']}

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

function callPrepare(
  result: ReturnType<typeof linkField>,
  selection: Record<string, unknown>,
): PreviewValue {
  const typeDef = result.types[0]
  const prepare = typeDef && 'preview' in typeDef ? typeDef.preview?.prepare : undefined
  if (!prepare) throw new Error('Expected preview.prepare on type definition')

  return prepare(selection)
}

describe('linkField', () => {
  test('returns one type named core.presets.link', () => {
    const result = linkField(defaultConfig)

    expect(result.types).toHaveLength(1)
    expect(result.types[0]?.name).toBe(LINK_FIELD_TYPE)
  })

  test('type is an object with 4 fields', () => {
    const fields = getFields(linkField(defaultConfig))

    expect(fields).toHaveLength(4)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['linkType', 'reference', 'url', 'openInNewTab'])
  })

  test('throws when internalTypes is empty', () => {
    expect(() => linkField({internalTypes: []})).toThrow(
      '[@sanity/presets] linkField requires at least one internalTypes entry.',
    )
  })

  test('maps internalTypes to reference targets', () => {
    const fields = getFields(linkField({internalTypes: ['page', 'post']}))
    const referenceField = getField(fields, 'reference')

    expect(referenceField).toHaveProperty('to', [{type: 'page'}, {type: 'post'}])
  })

  test('hidden callbacks show correct fields for internal type', () => {
    const fields = getFields(linkField(defaultConfig))
    const internalParent = {linkType: 'internal'}

    expect(evaluateHidden(getField(fields, 'reference'), internalParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'url'), internalParent)).toBe(true)
    expect(evaluateHidden(getField(fields, 'openInNewTab'), internalParent)).toBe(true)
  })

  test('hidden callbacks show correct fields for external type', () => {
    const fields = getFields(linkField(defaultConfig))
    const externalParent = {linkType: 'external'}

    expect(evaluateHidden(getField(fields, 'reference'), externalParent)).toBe(true)
    expect(evaluateHidden(getField(fields, 'url'), externalParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'openInNewTab'), externalParent)).toBe(false)
  })

  test('hidden callbacks show conditional fields when linkType is undefined', () => {
    const fields = getFields(linkField(defaultConfig))
    const emptyParent = {linkType: undefined}

    expect(evaluateHidden(getField(fields, 'reference'), emptyParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'url'), emptyParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'openInNewTab'), emptyParent)).toBe(false)
  })
})

describe('linkField preview.select', () => {
  test('selects correct paths for preview', () => {
    const typeDef = linkField(defaultConfig).types[0]
    const select = typeDef && 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      linkType: 'linkType',
      url: 'url',
      referenceTitle: 'reference.title',
    })
  })
})

type ValidationFn = (value: unknown, context: {parent?: {linkType?: string}}) => string | true

function extractCustomValidator(field: FieldDefinition): ValidationFn {
  let validator!: ValidationFn
  const mockRule = {
    custom: (fn: ValidationFn) => {
      validator = fn
      return mockRule
    },
    uri: () => mockRule,
  }

  if (typeof field.validation === 'function') {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    field.validation(mockRule as any)
  }

  return validator
}

describe('linkField validation', () => {
  test('reference field requires value when linkType is internal', () => {
    const fields = getFields(linkField(defaultConfig))
    const validate = extractCustomValidator(getField(fields, 'reference'))

    expect(validate(undefined, {parent: {linkType: 'internal'}})).toBe(
      'A reference is required for internal links',
    )
  })

  test('reference field passes when linkType is internal and value is present', () => {
    const fields = getFields(linkField(defaultConfig))
    const validate = extractCustomValidator(getField(fields, 'reference'))

    expect(validate({_ref: 'doc-123'}, {parent: {linkType: 'internal'}})).toBe(true)
  })

  test('reference field passes when linkType is external regardless of value', () => {
    const fields = getFields(linkField(defaultConfig))
    const validate = extractCustomValidator(getField(fields, 'reference'))

    expect(validate(undefined, {parent: {linkType: 'external'}})).toBe(true)
  })

  test('url field requires value when linkType is external', () => {
    const fields = getFields(linkField(defaultConfig))
    const validate = extractCustomValidator(getField(fields, 'url'))

    expect(validate(undefined, {parent: {linkType: 'external'}})).toBe(
      'A URL is required for external links',
    )
  })

  test('url field passes when linkType is external and value is present', () => {
    const fields = getFields(linkField(defaultConfig))
    const validate = extractCustomValidator(getField(fields, 'url'))

    expect(validate('https://example.com', {parent: {linkType: 'external'}})).toBe(true)
  })

  test('url field passes when linkType is internal regardless of value', () => {
    const fields = getFields(linkField(defaultConfig))
    const validate = extractCustomValidator(getField(fields, 'url'))

    expect(validate(undefined, {parent: {linkType: 'internal'}})).toBe(true)
  })
})

describe('linkField preview.prepare', () => {
  const preset = linkField(defaultConfig)

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

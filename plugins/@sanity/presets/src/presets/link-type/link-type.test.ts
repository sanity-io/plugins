import type {FieldDefinition, PreviewValue, SchemaTypeDefinition} from 'sanity'
import {describe, expect} from 'vitest'

import {getField, getFields, test} from '../../test/fixtures'
import {linkType} from './index'

const defaultConfig = {name: 'link', to: ['page']}

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
  schemaType: SchemaTypeDefinition,
  selection: Record<string, unknown>,
): PreviewValue {
  const prepare = 'preview' in schemaType ? schemaType.preview?.prepare : undefined
  if (!prepare) throw new Error('Expected preview.prepare on type definition')

  return prepare(selection)
}

describe('linkType', () => {
  test('has the expected name and identifier', () => {
    expect(linkType.name).toBe('link')
    expect(linkType.identifier).toBe('core.link')
  })

  test('returns a result with type named link', ({stubRegistry}) => {
    const result = linkType.schemaType(defaultConfig, stubRegistry)

    expect(result.name).toBe('link')
  })

  test('type is an object with 4 fields', ({stubRegistry}) => {
    const fields = getFields(linkType.schemaType(defaultConfig, stubRegistry))

    expect(fields).toHaveLength(4)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['linkType', 'reference', 'url', 'openInNewTab'])
  })

  test('maps to entries to reference targets', ({stubRegistry}) => {
    const fields = getFields(
      linkType.schemaType({name: 'link', to: ['page', 'post']}, stubRegistry),
    )
    const referenceField = getField(fields, 'reference')

    expect(referenceField).toHaveProperty('to', [{type: 'page'}, {type: 'post'}])
  })

  test('accepts object-form entries in to', ({stubRegistry}) => {
    const fields = getFields(
      linkType.schemaType({name: 'link', to: [{type: 'page'}, {type: 'post'}]}, stubRegistry),
    )

    expect(getField(fields, 'reference')).toHaveProperty('to', [{type: 'page'}, {type: 'post'}])
  })

  test('accepts mixed string and object entries in to', ({stubRegistry}) => {
    const fields = getFields(
      linkType.schemaType({name: 'link', to: ['page', {type: 'post'}]}, stubRegistry),
    )

    expect(getField(fields, 'reference')).toHaveProperty('to', [{type: 'page'}, {type: 'post'}])
  })

  test('hidden callbacks show correct fields for internal type', ({stubRegistry}) => {
    const fields = getFields(linkType.schemaType(defaultConfig, stubRegistry))
    const internalParent = {linkType: 'internal'}

    expect(evaluateHidden(getField(fields, 'reference'), internalParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'url'), internalParent)).toBe(true)
    expect(evaluateHidden(getField(fields, 'openInNewTab'), internalParent)).toBe(true)
  })

  test('hidden callbacks show correct fields for external type', ({stubRegistry}) => {
    const fields = getFields(linkType.schemaType(defaultConfig, stubRegistry))
    const externalParent = {linkType: 'external'}

    expect(evaluateHidden(getField(fields, 'reference'), externalParent)).toBe(true)
    expect(evaluateHidden(getField(fields, 'url'), externalParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'openInNewTab'), externalParent)).toBe(false)
  })

  test('hidden callbacks show conditional fields when linkType is undefined', ({stubRegistry}) => {
    const fields = getFields(linkType.schemaType(defaultConfig, stubRegistry))
    const emptyParent = {linkType: undefined}

    expect(evaluateHidden(getField(fields, 'reference'), emptyParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'url'), emptyParent)).toBe(false)
    expect(evaluateHidden(getField(fields, 'openInNewTab'), emptyParent)).toBe(false)
  })
})

describe('linkType preview.select', () => {
  test('selects correct paths for preview', ({stubRegistry}) => {
    const typeDef = linkType.schemaType(defaultConfig, stubRegistry)
    const select = 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      linkType: 'linkType',
      url: 'url',
      referenceTitle: 'reference.title',
      referenceName: 'reference.name',
    })
  })
})

describe('linkType preview.prepare', () => {
  test('internal link with a reference title', ({stubRegistry}) => {
    const schemaType = linkType.schemaType(defaultConfig, stubRegistry)
    const result = callPrepare(schemaType, {
      linkType: 'internal',
      referenceTitle: 'About Us',
      url: undefined,
    })

    expect(result).toEqual({title: 'About Us', subtitle: 'Internal link'})
  })

  test('internal link falls back to reference name when title is missing', ({stubRegistry}) => {
    const schemaType = linkType.schemaType(defaultConfig, stubRegistry)
    const result = callPrepare(schemaType, {
      linkType: 'internal',
      referenceTitle: undefined,
      referenceName: 'about-us',
      url: undefined,
    })

    expect(result).toEqual({title: 'about-us', subtitle: 'Internal link'})
  })

  test('internal link without reference title or name shows fallback', ({stubRegistry}) => {
    const schemaType = linkType.schemaType(defaultConfig, stubRegistry)
    const result = callPrepare(schemaType, {
      linkType: 'internal',
      referenceTitle: undefined,
      referenceName: undefined,
      url: undefined,
    })

    expect(result).toEqual({title: 'No reference', subtitle: 'Internal link'})
  })

  test('external link with a URL', ({stubRegistry}) => {
    const schemaType = linkType.schemaType(defaultConfig, stubRegistry)
    const result = callPrepare(schemaType, {
      linkType: 'external',
      url: 'https://example.com',
      referenceTitle: undefined,
    })

    expect(result).toEqual({title: 'https://example.com', subtitle: 'External link'})
  })

  test('external link without URL shows fallback', ({stubRegistry}) => {
    const schemaType = linkType.schemaType(defaultConfig, stubRegistry)
    const result = callPrepare(schemaType, {
      linkType: 'external',
      url: undefined,
      referenceTitle: undefined,
    })

    expect(result).toEqual({title: 'No URL', subtitle: 'External link'})
  })

  test('undefined linkType defaults to internal link fallback', ({stubRegistry}) => {
    const schemaType = linkType.schemaType(defaultConfig, stubRegistry)
    const result = callPrepare(schemaType, {
      linkType: undefined,
      url: undefined,
      referenceTitle: undefined,
    })

    expect(result).toEqual({title: 'No reference', subtitle: 'Internal link'})
  })
})

import {Schema} from '@sanity/schema'
import {defineArrayMember, defineField, defineType, type ObjectSchemaType} from 'sanity'
import {describe, expect, test} from 'vitest'

import {DEFAULT_MAX_FIELD_SELECTION_DEPTH, getFieldRefs} from './helpers'

// Mirrors the shape from sanity-io/plugins#1992: array item -> object -> array item -> locale
// object -> string, which puts the translated strings 7 path segments deep.
const schema = Schema.compile({
  name: 'test',
  types: [
    defineType({
      type: 'object',
      name: 'localeString',
      fields: [
        {type: 'string', name: 'en'},
        {type: 'string', name: 'fr'},
      ],
    }),
    defineType({
      type: 'object',
      name: 'temporaryHours',
      fields: [
        {type: 'string', name: 'startDate'},
        defineField({type: 'localeString', name: 'reason'}),
      ],
    }),
    defineType({
      type: 'object',
      name: 'hoursOfOperation',
      fields: [
        defineField({
          type: 'array',
          name: 'temporaryHours',
          of: [defineArrayMember({type: 'temporaryHours'})],
        }),
      ],
    }),
    defineType({
      type: 'object',
      name: 'overviewHours',
      fields: [
        defineField({type: 'localeString', name: 'title'}),
        defineField({type: 'hoursOfOperation', name: 'hoursOfOperation'}),
      ],
    }),
    defineType({
      type: 'document',
      name: 'displayControls',
      fields: [
        defineField({type: 'string', name: 'title'}),
        defineField({
          type: 'array',
          name: 'overviewHours',
          of: [defineArrayMember({type: 'overviewHours'})],
        }),
      ],
    }),
  ],
})

// oxlint-disable-next-line no-unsafe-type-assertion
const documentType = schema.get('displayControls') as ObjectSchemaType

// Field ref keys are `pathToString` output made patch-safe: `[_key=="x"]` becomes `|_key:x|`
const reasonKey =
  'overviewHours|_key:overviewHours|.hoursOfOperation.temporaryHours|_key:temporaryHours|.reason'
const reasonEnKey = `${reasonKey}.en`

function keys(maxDepth?: number) {
  return getFieldRefs(documentType, maxDepth).map((ref) => ref.key)
}

describe('getFieldRefs', () => {
  test('collects fields up to 6 path segments by default', () => {
    expect(DEFAULT_MAX_FIELD_SELECTION_DEPTH).toBe(6)

    const defaultKeys = keys()
    expect(defaultKeys).toEqual(keys(DEFAULT_MAX_FIELD_SELECTION_DEPTH))
    expect(defaultKeys).toContain(reasonKey)
    expect(defaultKeys).not.toContain(reasonEnKey)
  })

  test('collects deeper fields when maxDepth is raised', () => {
    const deepKeys = keys(8)
    expect(deepKeys).toContain(reasonKey)
    expect(deepKeys).toContain(reasonEnKey)
    expect(deepKeys).toContain(`${reasonKey}.fr`)
    // everything that was collected by default is still there
    for (const key of keys()) {
      expect(deepKeys).toContain(key)
    }
  })

  test('only collects root fields when maxDepth is 1', () => {
    expect(keys(1)).toEqual(['title', 'overviewHours'])
  })

  test('keeps ancestor titles in the breadcrumb title of deep fields', () => {
    const reasonEn = getFieldRefs(documentType, 8).find((ref) => ref.key === reasonEnKey)
    expect(reasonEn?.title).toBe(
      'Overview Hours / Overview Hours / Hours Of Operation / Temporary Hours / Temporary Hours / Reason / En',
    )
    expect(reasonEn?.schemaType.jsonType).toBe('string')
  })
})

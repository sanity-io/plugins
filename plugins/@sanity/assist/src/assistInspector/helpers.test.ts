import {Schema} from '@sanity/schema'
import {defineArrayMember, defineField, defineType, type ObjectSchemaType, pathToString} from 'sanity'
import {describe, expect, test} from 'vitest'

import {getFieldRefs} from './helpers'

// Mirrors a locale-object pattern where translated strings end up deeply
// nested: array item -> object -> array item -> locale object -> string
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
        defineField({
          type: 'array',
          name: 'overviewHours',
          of: [defineArrayMember({type: 'overviewHours'})],
        }),
      ],
    }),
  ],
})

const documentType = schema.get('displayControls') as ObjectSchemaType

// overviewHours -> [_key] -> hoursOfOperation -> temporaryHours -> [_key] -> reason -> en
const deepLocalePath =
  'overviewHours[_key=="overviewHours"].hoursOfOperation.temporaryHours[_key=="temporaryHours"].reason.en'
const localeObjectPath =
  'overviewHours[_key=="overviewHours"].hoursOfOperation.temporaryHours[_key=="temporaryHours"].reason'

function refPaths(maxDepth?: number) {
  return getFieldRefs(documentType, undefined, 0, maxDepth).map((ref) => pathToString(ref.path))
}

describe('getFieldRefs', () => {
  test('excludes fields deeper than the default max depth', () => {
    const paths = refPaths()
    expect(paths).toContain(localeObjectPath)
    expect(paths).not.toContain(deepLocalePath)
  })

  test('includes deeper fields when maxDepth is raised', () => {
    const paths = refPaths(8)
    expect(paths).toContain(localeObjectPath)
    expect(paths).toContain(deepLocalePath)
  })

  test('excludes shallower fields when maxDepth is lowered', () => {
    const paths = refPaths(1)
    expect(paths).toEqual(['overviewHours'])
  })
})

import {Schema} from '@sanity/schema'
import {defineField, defineType, type ObjectSchemaType} from 'sanity'
import {expect, test} from 'vitest'

import {createFieldRefCache} from './fieldRefCache'

// nested objects: level1.level2.level3.level4.level5.level6.leaf (7 path segments)
const leafKey = 'level1.level2.level3.level4.level5.level6.leaf'

function nested(depth: number): ReturnType<typeof defineField> {
  return depth > 6
    ? defineField({type: 'string', name: 'leaf'})
    : defineField({type: 'object', name: `level${depth}`, fields: [nested(depth + 1)]})
}

const schema = Schema.compile({
  name: 'test',
  types: [defineType({type: 'document', name: 'deep', fields: [nested(1)]})],
})

// oxlint-disable-next-line no-unsafe-type-assertion
const documentType = schema.get('deep') as ObjectSchemaType

test('uses the default depth when none is configured', () => {
  const {fieldRefs, fieldRefsByTypePath} = createFieldRefCache()(documentType)
  expect(fieldRefs.map((ref) => ref.key)).toContain('level1.level2.level3.level4.level5.level6')
  expect(fieldRefsByTypePath[leafKey]).toBeUndefined()
})

test('builds the field refs with the configured maxFieldSelectionDepth', () => {
  const {fieldRefs, fieldRefsByTypePath} = createFieldRefCache(7)(documentType)
  expect(fieldRefs.map((ref) => ref.key)).toContain(leafKey)
  expect(fieldRefsByTypePath[leafKey]?.schemaType.jsonType).toBe('string')
})

test('caches field refs per document type', () => {
  const getRefsForType = createFieldRefCache(7)
  expect(getRefsForType(documentType)).toBe(getRefsForType(documentType))
})

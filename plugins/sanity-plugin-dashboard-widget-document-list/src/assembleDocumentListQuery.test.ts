import {expect, test} from 'vitest'

import {assembleDocumentListQuery} from './assembleDocumentListQuery'

/**
 * Content Lake rejects a GROQ query that names a parameter the params object
 * does not contain. The reported message is `param $types references, but not provided`.
 */
function missingGroqParamError(query: string, params: Record<string, unknown>): string | undefined {
  for (const match of query.matchAll(/\$([A-Za-z_][A-Za-z0-9_]*)/g)) {
    const name = match[1]
    if (name && !Object.hasOwn(params, name)) {
      return `param $${name} references, but not provided`
    }
  }
  return undefined
}

const defaults = {
  order: '_createdAt desc',
  limit: 10,
  documentTypeNames: ['book', 'author'],
}

test('documented params option is sent with a custom query', () => {
  const query = '*[_type in $types]'
  const {assembledQuery, params} = assembleDocumentListQuery({
    ...defaults,
    query,
    params: {types: ['book']},
  })

  expect(missingGroqParamError(assembledQuery, params)).toBeUndefined()
  expect(params).toEqual({types: ['book']})
})

test('README params example provides $ids', () => {
  const query = '*[_id in $ids]'
  const {assembledQuery, params} = assembleDocumentListQuery({
    ...defaults,
    query,
    params: {ids: ['ab2', 'c5z', '654']},
  })

  expect(missingGroqParamError(assembledQuery, params)).toBeUndefined()
  expect(params).toEqual({ids: ['ab2', 'c5z', '654']})
})

test('queryParams still supplies custom query parameters', () => {
  const query = '*[_type in $types]'
  const {assembledQuery, params} = assembleDocumentListQuery({
    ...defaults,
    query,
    queryParams: {types: ['article']},
  })

  expect(missingGroqParamError(assembledQuery, params)).toBeUndefined()
  expect(params).toEqual({types: ['article']})
})

test('queryParams wins when both param options are set', () => {
  const query = '*[_id in $ids]'
  const {assembledQuery, params} = assembleDocumentListQuery({
    ...defaults,
    query,
    params: {ids: ['from-params']},
    queryParams: {ids: ['from-query-params']},
  })

  expect(missingGroqParamError(assembledQuery, params)).toBeUndefined()
  expect(params).toEqual({ids: ['from-query-params']})
})

test('default list query provides $types from the schema', () => {
  const {assembledQuery, params} = assembleDocumentListQuery(defaults)

  expect(assembledQuery).toBe('*[_type in $types] | order(_createdAt desc) [0...20]')
  expect(missingGroqParamError(assembledQuery, params)).toBeUndefined()
  expect(params).toEqual({types: ['book', 'author']})
})

test('configured types are limited to document types in the schema', () => {
  const {assembledQuery, params} = assembleDocumentListQuery({
    ...defaults,
    types: ['book', 'missing'],
    limit: 5,
  })

  expect(assembledQuery).toBe('*[_type in $types] | order(_createdAt desc) [0...10]')
  expect(params).toEqual({types: ['book']})
})

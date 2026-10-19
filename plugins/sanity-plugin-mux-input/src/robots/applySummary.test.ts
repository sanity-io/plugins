import type {ObjectSchemaType} from 'sanity'
import {describe, expect, test} from 'vitest'

import {
  defaultSummaryTargets,
  pickSummaryTarget,
  summaryFieldValues,
  summaryOutputRows,
  summaryTargetFields,
} from './applySummary'

const string = {name: 'string', jsonType: 'string'}
const text = {name: 'text', jsonType: 'string', type: string}
const url = {name: 'url', jsonType: 'string', type: string}

const field = (name: string, type: object, extra: object = {}) => ({
  name,
  type: {title: name[0]!.toUpperCase() + name.slice(1), ...type, ...extra},
})

// Just the parts of a compiled schema type the target lookup reads.
const documentType = {
  name: 'video',
  jsonType: 'object',
  fields: [
    field('title', string),
    field('description', text),
    field('tags', {name: 'array', jsonType: 'array', of: [string]}),
    field('website', url),
    field('category', string, {options: {list: ['news', 'sport']}}),
    field('internalNote', string, {readOnly: true}),
    field('video', {name: 'mux.video', jsonType: 'object', fields: []}),
  ],
} as unknown as ObjectSchemaType

const summary = {jobId: 'j1', title: 'Boxing match', description: 'Two fighters.', tags: ['boxing']}

describe('apply summary', () => {
  test('offers free text and lists of free text only', () => {
    expect(summaryTargetFields(documentType)).toEqual([
      {name: 'title', title: 'Title', kind: 'text'},
      {name: 'description', title: 'Description', kind: 'text'},
      {name: 'tags', title: 'Tags', kind: 'list'},
    ])
  })

  test('maps outputs to the fields named like them, unless those have content', () => {
    const rows = summaryOutputRows(summary)
    const fields = summaryTargetFields(documentType)
    expect(defaultSummaryTargets(rows, fields, {title: 'Already set', tags: []})).toEqual({
      description: 'description',
      tags: 'tags',
    })
  })

  test('never writes one field twice', () => {
    const targets = pickSummaryTarget(
      {title: 'title', description: 'description'},
      'title',
      'description',
    )
    expect(targets).toEqual({title: 'description'})
    expect(pickSummaryTarget(targets, 'title', undefined)).toEqual({})
  })

  test('sets exactly the picked fields', () => {
    const rows = summaryOutputRows(summary)
    expect(summaryFieldValues(rows, {title: 'title', tags: 'tags'})).toEqual({
      title: 'Boxing match',
      tags: ['boxing'],
    })
  })

  test('skips outputs without a value', () => {
    expect(summaryOutputRows({jobId: 'j1', title: '  ', tags: []})).toEqual([])
    expect(summaryOutputRows(undefined)).toEqual([])
  })
})

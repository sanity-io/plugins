import type {ObjectSchemaType, SanityDocument} from 'sanity'
import {describe, expect, test} from 'vitest'

import {isDocAssistable} from './RequestRunInstructionProvider'

function schema(liveEdit?: boolean) {
  // oxlint-disable-next-line no-unsafe-type-assertion
  return {liveEdit} as ObjectSchemaType
}

function doc(id: string): SanityDocument {
  return {_id: id, _type: 'article', _rev: '1', _createdAt: '', _updatedAt: ''}
}

describe('isDocAssistable', () => {
  test('is false after publish when only published values exist (virtual draft)', () => {
    expect(isDocAssistable(schema(), doc('article-1'), null)).toBe(false)
  })

  test('is true when a real draft snapshot exists', () => {
    expect(isDocAssistable(schema(), doc('article-1'), doc('drafts.article-1'))).toBe(true)
  })

  test('is true for a draft-only unpublished document', () => {
    expect(isDocAssistable(schema(), null, doc('drafts.article-1'))).toBe(true)
  })

  test('is false when neither draft nor published exists', () => {
    expect(isDocAssistable(schema(), null, null)).toBe(false)
  })

  test('uses published for live-edit types', () => {
    expect(isDocAssistable(schema(true), doc('article-1'), null)).toBe(true)
    expect(isDocAssistable(schema(true), null, doc('drafts.article-1'))).toBe(false)
  })
})

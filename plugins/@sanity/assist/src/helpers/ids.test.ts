import {describe, expect, test} from 'vitest'

import {assistDocumentId, assistTasksStatusId, getAssistWriteDocumentId} from './ids'

describe('ids', () => {
  test('assistDocumentId should replace illegal id chars with _', () => {
    const testCases = [
      {schemaType: 'test', assistId: 'sanity.assist.schemaType.test'},
      {schemaType: 'test-type', assistId: 'sanity.assist.schemaType.test-type'},
      {schemaType: 'test/type', assistId: 'sanity.assist.schemaType.test_type'},
      {schemaType: '%broken©™£€∞', assistId: 'sanity.assist.schemaType._broken_____'},
    ]
    const outputs = testCases.map((testCase) => assistDocumentId(testCase.schemaType))
    const expected = testCases.map((testCase) => testCase.assistId)
    expect(outputs).toEqual(expected)
  })

  test.each([
    {documentId: 'foo', assistId: 'sanity.assist.status.foo'},
    {documentId: 'drafts.foo', assistId: 'sanity.assist.status.foo'},
    {documentId: 'versions.r12332.foo', assistId: 'sanity.assist.status.r12332.foo'},
  ])(
    "assistTasksStatusId should return the documentId with 'sanity.assist.status' prefix for $documentId",
    ({documentId, assistId}) => {
      expect(assistTasksStatusId(documentId)).toEqual(assistId)
    },
  )
})

describe('getAssistWriteDocumentId', () => {
  test('targets drafts.* for published or draft ids on non-live-edit types', () => {
    expect(getAssistWriteDocumentId('article-1')).toBe('drafts.article-1')
    expect(getAssistWriteDocumentId('drafts.article-1')).toBe('drafts.article-1')
  })

  test('targets published for live-edit types', () => {
    expect(getAssistWriteDocumentId('article-1', {liveEdit: true})).toBe('article-1')
    expect(getAssistWriteDocumentId('drafts.article-1', {liveEdit: true})).toBe('article-1')
  })

  test('keeps release version ids and builds them from a release id', () => {
    expect(getAssistWriteDocumentId('versions.rSummer.article-1')).toBe(
      'versions.rSummer.article-1',
    )
    expect(getAssistWriteDocumentId('article-1', {releaseId: 'rSummer'})).toBe(
      'versions.rSummer.article-1',
    )
  })
})

import type {TargetDocumentState, VersionInfoDocumentStub} from 'sanity'
import {describe, expect, test} from 'vitest'

import {assistDocumentId, assistTasksStatusId, getAssistWriteDocumentId} from './ids'

function stub(id: string, draftRef?: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: '1',
    _createdAt: '',
    _updatedAt: '',
    _system: {
      group: {_ref: 'article-1', _weak: true},
      ...(draftRef ? {draft: {_ref: draftRef, _weak: true as const}} : {}),
    },
  }
}

function readyState(siblings: {
  published?: VersionInfoDocumentStub
  draft?: VersionInfoDocumentStub
  version?: VersionInfoDocumentStub
}): Extract<TargetDocumentState, {status: 'ready'}> {
  return {
    status: 'ready',
    targetDocument: siblings.version ?? siblings.draft ?? siblings.published,
    scopeId: undefined,
    variant: undefined,
    siblings: {
      published: siblings.published,
      draft: siblings.draft,
      version: siblings.version,
    },
  }
}

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
  test('returns undefined when targetDocumentState is missing', () => {
    expect(getAssistWriteDocumentId()).toBeUndefined()
    expect(getAssistWriteDocumentId({liveEdit: true, releaseId: 'rSummer'})).toBeUndefined()
  })

  test.each([
    {status: 'resolving'} satisfies TargetDocumentState,
    {
      status: 'variant-definition-document-not-found',
      requestedVariantName: 'en',
    } satisfies TargetDocumentState,
  ])('returns undefined when targetDocumentState is $status', (targetDocumentState) => {
    expect(getAssistWriteDocumentId({targetDocumentState})).toBeUndefined()
  })

  test('targets the draft sibling for non-live-edit types', () => {
    expect(
      getAssistWriteDocumentId({
        targetDocumentState: readyState({
          published: stub('article-1'),
          draft: stub('drafts.article-1'),
        }),
      }),
    ).toBe('drafts.article-1')
    expect(
      getAssistWriteDocumentId({
        targetDocumentState: readyState({draft: stub('drafts.article-1')}),
      }),
    ).toBe('drafts.article-1')
  })

  test('falls back to the published virtual-draft ref when the draft sibling is missing', () => {
    expect(
      getAssistWriteDocumentId({
        targetDocumentState: readyState({
          published: stub('article-1', 'drafts.article-1'),
        }),
      }),
    ).toBe('drafts.article-1')
  })

  test('returns undefined when neither a draft sibling nor a virtual-draft ref exists', () => {
    expect(
      getAssistWriteDocumentId({
        targetDocumentState: readyState({published: stub('article-1')}),
      }),
    ).toBeUndefined()
  })

  test('targets published for live-edit types', () => {
    expect(
      getAssistWriteDocumentId({
        liveEdit: true,
        targetDocumentState: readyState({published: stub('article-1')}),
      }),
    ).toBe('article-1')
    expect(
      getAssistWriteDocumentId({
        liveEdit: true,
        targetDocumentState: readyState({
          published: stub('article-1'),
          draft: stub('drafts.article-1'),
        }),
      }),
    ).toBe('article-1')
  })

  test('targets the version sibling when a release is selected', () => {
    expect(
      getAssistWriteDocumentId({
        releaseId: 'rSummer',
        targetDocumentState: readyState({
          published: stub('article-1'),
          version: stub('versions.rSummer.article-1'),
        }),
      }),
    ).toBe('versions.rSummer.article-1')
  })

  test('a selected release wins over live-edit and draft siblings', () => {
    expect(
      getAssistWriteDocumentId({
        liveEdit: true,
        releaseId: 'rSummer',
        targetDocumentState: readyState({
          published: stub('article-1'),
          draft: stub('drafts.article-1'),
          version: stub('versions.rSummer.article-1'),
        }),
      }),
    ).toBe('versions.rSummer.article-1')
  })

  test('returns undefined when a release is selected but the version sibling is missing', () => {
    expect(
      getAssistWriteDocumentId({
        releaseId: 'rSummer',
        targetDocumentState: readyState({draft: stub('drafts.article-1')}),
      }),
    ).toBeUndefined()
  })
})

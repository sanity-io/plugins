import type {SystemVariant, TargetDocumentState, VersionInfoDocumentStub} from 'sanity'
import {describe, expect, test} from 'vitest'

import {assistDocumentId, assistTasksStatusId, getAssistWriteDocumentId} from './ids'

const DOCUMENT_ID = 'article-1'

function stub(id: string, draftRef?: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: '1',
    _createdAt: '',
    _updatedAt: '',
    _system: {
      group: {_ref: DOCUMENT_ID, _weak: true},
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

function selectedVariant(): SystemVariant {
  return {
    _id: '_.variants.en',
    _type: 'system.variant',
    _rev: '1',
    _createdAt: '',
    _updatedAt: '',
    conditions: {},
    priority: 0,
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
    expect(getAssistWriteDocumentId({documentId: DOCUMENT_ID})).toBeUndefined()
    expect(
      getAssistWriteDocumentId({documentId: DOCUMENT_ID, liveEdit: true, releaseId: 'rSummer'}),
    ).toBeUndefined()
  })

  test.each([
    {status: 'resolving'} satisfies TargetDocumentState,
    {
      status: 'variant-definition-document-not-found',
      requestedVariantName: 'en',
    } satisfies TargetDocumentState,
  ])('returns undefined when targetDocumentState is $status', (targetDocumentState) => {
    expect(getAssistWriteDocumentId({documentId: DOCUMENT_ID, targetDocumentState})).toBeUndefined()
  })

  test('targets the draft sibling for non-live-edit types', () => {
    expect(
      getAssistWriteDocumentId({
        documentId: DOCUMENT_ID,
        targetDocumentState: readyState({
          published: stub(DOCUMENT_ID),
          draft: stub(`drafts.${DOCUMENT_ID}`),
        }),
      }),
    ).toBe('drafts.article-1')
    expect(
      getAssistWriteDocumentId({
        documentId: DOCUMENT_ID,
        targetDocumentState: readyState({draft: stub(`drafts.${DOCUMENT_ID}`)}),
      }),
    ).toBe('drafts.article-1')
  })

  test('falls back to drafts.* from documentId when the draft sibling is missing', () => {
    expect(
      getAssistWriteDocumentId({
        documentId: DOCUMENT_ID,
        targetDocumentState: readyState({published: stub(DOCUMENT_ID, 'drafts.should-not-use')}),
      }),
    ).toBe('drafts.article-1')
    expect(
      getAssistWriteDocumentId({
        documentId: 'drafts.article-1',
        targetDocumentState: readyState({published: stub(DOCUMENT_ID)}),
      }),
    ).toBe('drafts.article-1')
  })

  test('falls back to the published virtual-draft ref when a variant is selected', () => {
    expect(
      getAssistWriteDocumentId({
        documentId: DOCUMENT_ID,
        variant: selectedVariant(),
        targetDocumentState: readyState({
          published: stub(DOCUMENT_ID, 'versions.scope.article-1'),
        }),
      }),
    ).toBe('versions.scope.article-1')
  })

  test('returns undefined when a variant is selected but no advertised draft ref exists', () => {
    expect(
      getAssistWriteDocumentId({
        documentId: DOCUMENT_ID,
        variant: selectedVariant(),
        targetDocumentState: readyState({published: stub(DOCUMENT_ID)}),
      }),
    ).toBeUndefined()
  })

  test('targets published for live-edit types', () => {
    expect(
      getAssistWriteDocumentId({
        documentId: DOCUMENT_ID,
        liveEdit: true,
        targetDocumentState: readyState({published: stub(DOCUMENT_ID)}),
      }),
    ).toBe('article-1')
    expect(
      getAssistWriteDocumentId({
        documentId: DOCUMENT_ID,
        liveEdit: true,
        targetDocumentState: readyState({
          published: stub(DOCUMENT_ID),
          draft: stub(`drafts.${DOCUMENT_ID}`),
        }),
      }),
    ).toBe('article-1')
  })

  test('targets the version sibling when a release is selected', () => {
    expect(
      getAssistWriteDocumentId({
        documentId: DOCUMENT_ID,
        releaseId: 'rSummer',
        targetDocumentState: readyState({
          published: stub(DOCUMENT_ID),
          version: stub('versions.rSummer.article-1'),
        }),
      }),
    ).toBe('versions.rSummer.article-1')
  })

  test('a selected release wins over live-edit, variant, and draft siblings', () => {
    expect(
      getAssistWriteDocumentId({
        documentId: DOCUMENT_ID,
        liveEdit: true,
        releaseId: 'rSummer',
        variant: selectedVariant(),
        targetDocumentState: readyState({
          published: stub(DOCUMENT_ID),
          draft: stub(`drafts.${DOCUMENT_ID}`),
          version: stub('versions.rSummer.article-1'),
        }),
      }),
    ).toBe('versions.rSummer.article-1')
  })

  test('returns undefined when a release is selected but the version sibling is missing', () => {
    expect(
      getAssistWriteDocumentId({
        documentId: DOCUMENT_ID,
        releaseId: 'rSummer',
        targetDocumentState: readyState({draft: stub(`drafts.${DOCUMENT_ID}`)}),
      }),
    ).toBeUndefined()
  })
})

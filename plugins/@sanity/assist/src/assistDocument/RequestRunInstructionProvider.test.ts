import type {ObjectSchemaType, TargetDocumentState, VersionInfoDocumentStub} from 'sanity'
import {describe, expect, test} from 'vitest'

import {isDocAssistable} from './RequestRunInstructionProvider'

function schema(liveEdit?: boolean) {
  // oxlint-disable-next-line no-unsafe-type-assertion
  return {liveEdit} as ObjectSchemaType
}

function stub(id: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: '1',
    _createdAt: '',
    _updatedAt: '',
    _system: {group: {_ref: 'article-1', _weak: true}},
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

describe('isDocAssistable', () => {
  test.each([
    {status: 'resolving'} satisfies TargetDocumentState,
    {
      status: 'variant-definition-document-not-found',
      requestedVariantName: 'en',
    } satisfies TargetDocumentState,
  ])('is false when targetDocumentState is $status', (targetDocumentState) => {
    expect(isDocAssistable(schema(), targetDocumentState, undefined)).toBe(false)
  })

  test('is false after publish when only published values exist (virtual draft)', () => {
    expect(isDocAssistable(schema(), readyState({published: stub('article-1')}), undefined)).toBe(
      false,
    )
  })

  test('is true when a real draft snapshot exists', () => {
    expect(
      isDocAssistable(
        schema(),
        readyState({
          published: stub('article-1'),
          draft: stub('drafts.article-1'),
        }),
        undefined,
      ),
    ).toBe(true)
  })

  test('is true for a draft-only unpublished document', () => {
    expect(
      isDocAssistable(schema(), readyState({draft: stub('drafts.article-1')}), undefined),
    ).toBe(true)
  })

  test('is false when neither draft nor published exists', () => {
    expect(isDocAssistable(schema(), readyState({}), undefined)).toBe(false)
  })

  test('uses published for live-edit types', () => {
    expect(
      isDocAssistable(schema(true), readyState({published: stub('article-1')}), undefined),
    ).toBe(true)
    expect(
      isDocAssistable(schema(true), readyState({draft: stub('drafts.article-1')}), undefined),
    ).toBe(false)
  })

  test('uses the version sibling when a release is selected', () => {
    expect(
      isDocAssistable(
        schema(),
        readyState({
          draft: stub('drafts.article-1'),
          version: stub('versions.rSummer.article-1'),
        }),
        'rSummer',
      ),
    ).toBe(true)
    expect(
      isDocAssistable(schema(), readyState({draft: stub('drafts.article-1')}), 'rSummer'),
    ).toBe(false)
  })
})

import type {EditStateFor, SanityDocument} from 'sanity'
import {describe, expect, test} from 'vitest'

import {isDocAssistable} from './RequestRunInstructionProvider'

function doc(id: string): SanityDocument {
  return {_id: id, _type: 'article', _rev: '1', _createdAt: '', _updatedAt: ''}
}

function editState(
  documents: Partial<Record<'draft' | 'published' | 'version', SanityDocument>>,
): Pick<EditStateFor, 'draft' | 'published' | 'version'> {
  return {
    draft: documents.draft ?? null,
    published: documents.published ?? null,
    version: documents.version ?? null,
  }
}

describe('isDocAssistable', () => {
  test('is false without a write target id', () => {
    expect(isDocAssistable(undefined, editState({draft: doc('drafts.article-1')}))).toBe(false)
  })

  test('is false without an edit state', () => {
    expect(isDocAssistable('drafts.article-1', null)).toBe(false)
  })

  test('is false after publish when only published values exist (virtual draft)', () => {
    expect(isDocAssistable('drafts.article-1', editState({published: doc('article-1')}))).toBe(
      false,
    )
  })

  test('is true when the draft snapshot exists, including an optimistic one', () => {
    expect(
      isDocAssistable(
        'drafts.article-1',
        editState({published: doc('article-1'), draft: doc('drafts.article-1')}),
      ),
    ).toBe(true)
  })

  test('is false for a brand-new document that has not been created yet', () => {
    expect(isDocAssistable('drafts.article-1', editState({}))).toBe(false)
    expect(isDocAssistable('versions.rSummer.article-1', editState({}))).toBe(false)
    expect(isDocAssistable('article-1', editState({}))).toBe(false)
  })

  test('matches the published document for live-edit types', () => {
    expect(isDocAssistable('article-1', editState({published: doc('article-1')}))).toBe(true)
    expect(isDocAssistable('article-1', editState({draft: doc('drafts.article-1')}))).toBe(false)
  })

  test('matches the release version, not the base draft', () => {
    expect(
      isDocAssistable(
        'versions.rSummer.article-1',
        editState({
          draft: doc('drafts.article-1'),
          version: doc('versions.rSummer.article-1'),
        }),
      ),
    ).toBe(true)
    expect(
      isDocAssistable('versions.rSummer.article-1', editState({draft: doc('drafts.article-1')})),
    ).toBe(false)
  })

  test('matches a draft variant checked out as the pane version', () => {
    expect(
      isDocAssistable(
        'versions.scope.article-1',
        editState({
          published: doc('article-1'),
          draft: doc('drafts.article-1'),
          version: doc('versions.scope.article-1'),
        }),
      ),
    ).toBe(true)
  })

  test('is false for a creatable variant until its draft exists, even with base documents', () => {
    expect(
      isDocAssistable(
        'versions.scope.article-1',
        editState({published: doc('article-1'), draft: doc('drafts.article-1')}),
      ),
    ).toBe(false)
  })
})

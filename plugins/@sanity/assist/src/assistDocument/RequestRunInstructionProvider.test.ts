import {type ObjectSchemaType, PatchEvent, type SanityDocument} from 'sanity'
import {describe, expect, test, vi} from 'vitest'

import {
  canRunQueuedAssistWrite,
  createDraftMaterializationEvent,
  FORCE_DOCUMENT_CREATION_FIELD,
  isDocAssistable,
  needsDraftMaterialization,
  prepareAssistWrite,
} from './RequestRunInstructionProvider'

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

describe('needsDraftMaterialization', () => {
  test('is true only when no real write target exists', () => {
    expect(needsDraftMaterialization(false)).toBe(true)
    expect(needsDraftMaterialization(true)).toBe(false)
  })
})

describe('createDraftMaterializationEvent', () => {
  test('unsets the dummy field used to create a draft via form onChange', () => {
    const event = createDraftMaterializationEvent()
    expect(event).toBeInstanceOf(PatchEvent)
    expect(event.patches).toEqual([{type: 'unset', path: [FORCE_DOCUMENT_CREATION_FIELD]}])
  })
})

describe('canRunQueuedAssistWrite', () => {
  test('waits until a real draft exists and the create/patch has committed', () => {
    expect(canRunQueuedAssistWrite(false)).toBe(false)
    expect(canRunQueuedAssistWrite(true, true)).toBe(false)
    expect(canRunQueuedAssistWrite(true, false)).toBe(true)
    expect(canRunQueuedAssistWrite(true)).toBe(true)
  })
})

describe('prepareAssistWrite', () => {
  test('materializes a draft from published values when the draft is missing', () => {
    const documentOnChange = vi.fn()
    expect(
      prepareAssistWrite({
        isDocAssistable: false,
        documentOnChange,
      }),
    ).toBe('queue')
    expect(documentOnChange).toHaveBeenCalledTimes(1)
    expect(documentOnChange.mock.calls[0]?.[0].patches).toEqual([
      {type: 'unset', path: [FORCE_DOCUMENT_CREATION_FIELD]},
    ])
  })

  test('does not dirty a document that already has a real draft', () => {
    const documentOnChange = vi.fn()
    expect(
      prepareAssistWrite({
        isDocAssistable: true,
        documentOnChange,
      }),
    ).toBe('run')
    expect(documentOnChange).not.toHaveBeenCalled()
  })

  test('queues without another onChange while an existing draft is still syncing', () => {
    const documentOnChange = vi.fn()
    expect(
      prepareAssistWrite({
        isDocAssistable: true,
        isSyncing: true,
        documentOnChange,
      }),
    ).toBe('queue')
    expect(documentOnChange).not.toHaveBeenCalled()
  })
})

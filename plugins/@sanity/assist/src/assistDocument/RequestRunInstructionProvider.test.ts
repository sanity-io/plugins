import {type ObjectSchemaType, PatchEvent, type SanityDocument} from 'sanity'
import {describe, expect, test, vi} from 'vitest'

import {
  canRunQueuedAssistWrite,
  createDraftMaterializationEvent,
  createDraftMaterializationFallbackEvent,
  EMPTY_ACTION_GUARD_PSEUDO_FIELD,
  isDocAssistable,
  needsDraftMaterialization,
  prepareAssistWrite,
  shouldFallbackToEmptyActionGuard,
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
  test('is an empty / no-op PatchEvent so Studio can create the draft', () => {
    const event = createDraftMaterializationEvent()
    expect(event).toBeInstanceOf(PatchEvent)
    expect(event.patches).toEqual([])
  })
})

describe('createDraftMaterializationFallbackEvent', () => {
  test('unsets Studio empty-action-guard pseudo field', () => {
    const event = createDraftMaterializationFallbackEvent()
    expect(event).toBeInstanceOf(PatchEvent)
    expect(event.patches).toMatchObject([{type: 'unset', path: [EMPTY_ACTION_GUARD_PSEUDO_FIELD]}])
    expect(EMPTY_ACTION_GUARD_PSEUDO_FIELD).toBe('_empty_action_guard_pseudo_field_')
  })
})

describe('shouldFallbackToEmptyActionGuard', () => {
  test('is true only when the empty onChange did not create a draft or start sync', () => {
    expect(shouldFallbackToEmptyActionGuard(false, false, false)).toBe(true)
    expect(shouldFallbackToEmptyActionGuard(false, true, false)).toBe(false)
    expect(shouldFallbackToEmptyActionGuard(true, false, false)).toBe(false)
    expect(shouldFallbackToEmptyActionGuard(false, false, true)).toBe(false)
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
  test('fires an empty onChange when the draft is missing', () => {
    const documentOnChange = vi.fn()
    expect(
      prepareAssistWrite({
        isDocAssistable: false,
        documentOnChange,
      }),
    ).toBe('queue')
    expect(documentOnChange).toHaveBeenCalledTimes(1)
    expect(documentOnChange.mock.calls[0]?.[0]).toBeInstanceOf(PatchEvent)
    expect(documentOnChange.mock.calls[0]?.[0].patches).toEqual([])
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

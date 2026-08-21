import {describe, expect, test} from 'vitest'

import {documentExistsInStore} from './documentExistsInStore'

describe('documentExistsInStore', () => {
  test('returns false when editState is null', () => {
    expect(documentExistsInStore(null)).toBe(false)
  })

  test('returns false when the pair store is not ready yet', () => {
    expect(
      documentExistsInStore({
        ready: false,
        draft: {_id: 'drafts.doc'},
        published: null,
        version: null,
      }),
    ).toBe(false)
  })

  test('returns false when ready with no snapshots (new or deleted document)', () => {
    expect(
      documentExistsInStore({
        ready: true,
        draft: null,
        published: null,
        version: null,
      }),
    ).toBe(false)
  })

  test('returns true when a draft snapshot is present', () => {
    expect(
      documentExistsInStore({
        ready: true,
        draft: {_id: 'drafts.doc', _rev: 'rev1'},
        published: null,
        version: null,
      }),
    ).toBe(true)
  })

  test('returns true when only a published snapshot is present', () => {
    expect(
      documentExistsInStore({
        ready: true,
        draft: null,
        published: {_id: 'doc'},
        version: null,
      }),
    ).toBe(true)
  })

  test('returns true when only a version snapshot is present', () => {
    expect(
      documentExistsInStore({
        ready: true,
        draft: null,
        published: null,
        version: {_id: 'versions.r.doc'},
      }),
    ).toBe(true)
  })

  test('treats missing ready as ready so incomplete mocks still detect snapshots', () => {
    expect(
      documentExistsInStore({
        draft: {_id: 'drafts.doc'},
      }),
    ).toBe(true)
  })
})

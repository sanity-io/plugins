import type {SanityClient, SanityDocumentLike} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {createI18nDocAndPatchMetadata} from './createI18nDocAndPatchMetadata'

describe('createI18nDocAndPatchMetadata', () => {
  it('creates deterministic draft id and stores published reference', async () => {
    const patchBuilder = {insert: vi.fn().mockReturnValue({})}
    const transaction = {
      patch: vi.fn().mockImplementation((id, callback) => {
        callback(patchBuilder)
        return transaction
      }),
      commit: vi.fn().mockResolvedValue({}),
    }

    const client = {
      create: vi.fn().mockResolvedValue({
        _id: 'drafts.post-1__i18n_nb',
        _type: 'post',
      }),
      transaction: vi.fn().mockReturnValue(transaction),
    } as unknown as SanityClient

    const translatedDoc = {
      _id: 'drafts.post-1',
      _type: 'post',
      _rev: 'rev-1',
      _createdAt: '2026-01-01',
      _updatedAt: '2026-01-02',
      title: 'Hei',
    } as SanityDocumentLike

    await createI18nDocAndPatchMetadata(
      translatedDoc,
      'nb',
      client,
      {_id: 'metadata-1', translations: []},
      'language',
    )

    expect(client.create).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'drafts.post-1__i18n_nb',
        _type: 'post',
        language: 'nb',
      }),
    )
    expect(client.create).toHaveBeenCalledWith(
      expect.not.objectContaining({
        _rev: expect.anything(),
      }),
    )
    expect(transaction.patch).toHaveBeenCalledWith('metadata-1', expect.any(Function))
    expect(patchBuilder.insert).toHaveBeenCalledWith('after', 'translations[-1]', [
      expect.objectContaining({
        _key: 'nb',
        value: expect.objectContaining({_ref: 'post-1__i18n_nb'}),
      }),
    ])
    expect(transaction.commit).toHaveBeenCalled()
  })
})

import type {SanityClient, SanityDocument} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {findLatestDraft} from './findLatestDraft'

describe('findLatestDraft', () => {
  it('prefers draft id by prefix and normalizes input ids', async () => {
    const docs = [{_id: 'article-draft-content'}, {_id: 'drafts.article'}] as SanityDocument[]

    const fetch = vi.fn().mockResolvedValue(docs)
    const client = {fetch} as unknown as SanityClient

    const doc = await findLatestDraft('drafts.article', client)

    expect(fetch).toHaveBeenCalledWith(`*[_id == $id || _id == $draftId]`, {
      id: 'article',
      draftId: 'drafts.article',
    })
    expect(doc._id).toBe('drafts.article')
  })
})

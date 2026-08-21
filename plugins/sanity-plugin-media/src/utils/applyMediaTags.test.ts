// @vitest-environment node

import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient, mockPatchChain} from '../__tests__/fixtures/mockSanityClient'
import {TAG_DOCUMENT_NAME} from '../constants'
import type {Tag} from '../types'
import {applyMediaTags} from './applyMediaTags'

vi.mock('nanoid', () => ({
  nanoid: () => 'key-1',
}))

const existingTag: Tag = {
  _id: 'tag-product',
  _type: TAG_DOCUMENT_NAME,
  _createdAt: '',
  _updatedAt: '',
  _rev: 'r1',
  name: {_type: 'slug', current: 'product'},
}

describe('applyMediaTags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no-ops when mediaTags is empty', async () => {
    const client = createMockSanityClient()
    await applyMediaTags({client, assetId: 'asset-1', mediaTags: []})
    expect(client.fetch).not.toHaveBeenCalled()
    expect(client.create).not.toHaveBeenCalled()
  })

  it('reuses an existing tag and appends a weak reference', async () => {
    const chain = mockPatchChain({})
    const client = createMockSanityClient({
      fetch: vi.fn().mockResolvedValueOnce(existingTag).mockResolvedValueOnce({tagIds: []}),
      patch: vi.fn(() => chain),
    })

    await applyMediaTags({
      client,
      assetId: 'asset-1',
      mediaTags: ['product'],
    })

    expect(client.create).not.toHaveBeenCalled()
    expect(client.patch).toHaveBeenCalledWith('asset-1')
    expect(chain.append).toHaveBeenCalledWith('opt.media.tags', [
      {_key: 'key-1', _ref: 'tag-product', _type: 'reference', _weak: true},
    ])
    expect(chain.commit).toHaveBeenCalled()
  })

  it('creates missing tags when createTagsOnUpload is true', async () => {
    const createdTag: Tag = {
      ...existingTag,
      _id: 'tag-new',
      name: {_type: 'slug', current: 'new-tag'},
    }
    const chain = mockPatchChain({})
    const client = createMockSanityClient({
      fetch: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({tagIds: []}),
      create: vi.fn().mockResolvedValue(createdTag),
      patch: vi.fn(() => chain),
    })

    await applyMediaTags({
      client,
      assetId: 'asset-1',
      mediaTags: ['new-tag'],
      createTagsOnUpload: true,
    })

    expect(client.create).toHaveBeenCalledWith({
      _type: TAG_DOCUMENT_NAME,
      name: {_type: 'slug', current: 'new-tag'},
    })
    expect(chain.append).toHaveBeenCalledWith('opt.media.tags', [
      {_key: 'key-1', _ref: 'tag-new', _type: 'reference', _weak: true},
    ])
  })

  it('skips creating tags when createTagsOnUpload is false', async () => {
    const client = createMockSanityClient({
      fetch: vi.fn().mockResolvedValue(null),
    })

    await applyMediaTags({
      client,
      assetId: 'asset-1',
      mediaTags: ['missing'],
      createTagsOnUpload: false,
    })

    expect(client.create).not.toHaveBeenCalled()
    expect(client.patch).not.toHaveBeenCalled()
  })

  it('does not append tags that are already on the asset', async () => {
    const chain = mockPatchChain({})
    const client = createMockSanityClient({
      fetch: vi
        .fn()
        .mockResolvedValueOnce(existingTag)
        .mockResolvedValueOnce({tagIds: ['tag-product']}),
      patch: vi.fn(() => chain),
    })

    await applyMediaTags({
      client,
      assetId: 'asset-1',
      mediaTags: ['product'],
    })

    expect(client.patch).not.toHaveBeenCalled()
  })

  it('serializes concurrent calls for the same asset', {timeout: 10_000}, async () => {
    const order: string[] = []
    let releaseFirst: (() => void) | undefined
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })

    const chain = mockPatchChain({})
    const client = createMockSanityClient({
      fetch: vi.fn(async (query: string) => {
        if (String(query).includes('name.current')) {
          await firstGate
          return null
        }
        return {tagIds: []}
      }),
      create: vi.fn(async (doc: {_type: string; name: {current: string}}) => {
        order.push(`create:${doc.name.current}`)
        return {
          ...existingTag,
          _id: `tag-${doc.name.current}`,
          name: doc.name,
        }
      }),
      patch: vi.fn(() => chain),
    })

    const first = applyMediaTags({
      client,
      assetId: 'asset-1',
      mediaTags: ['first'],
    }).then(() => {
      order.push('first-done')
    })

    // Let the first call reach the gated fetch before starting the second
    await Promise.resolve()
    await Promise.resolve()

    const second = applyMediaTags({
      client,
      assetId: 'asset-1',
      mediaTags: ['second'],
    }).then(() => {
      order.push('second-done')
    })

    releaseFirst!()
    await Promise.all([first, second])

    expect(order.indexOf('first-done')).toBeLessThan(order.indexOf('second-done'))
    expect(order).toContain('create:first')
    expect(order).toContain('create:second')
  })
})

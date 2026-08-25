// @vitest-environment node

import {describe, expect, it, vi} from 'vitest'

import {createEpicTestStore} from '../../__tests__/fixtures/createEpicTestStore'
import {
  createMockSanityClient,
  mockTransactionCommit,
} from '../../__tests__/fixtures/mockSanityClient'
import type {ImageAsset} from '../../types'
import {
  assetsActions,
  assetsFolderSetEpic,
  assetsFolderSetRefreshEpic,
  initialState as assetsInitialState,
} from './index'

const sampleAsset = {
  _id: 'a1',
  _type: 'sanity.imageAsset',
  _createdAt: '',
  _updatedAt: '',
  _rev: 'r1',
  originalFilename: 'x.png',
  size: 1,
  mimeType: 'image/png',
  url: '',
} as ImageAsset

const assetItem = {
  _type: 'asset' as const,
  asset: sampleAsset,
  picked: true,
  updating: false,
}

describe('assetsFolderSetEpic', () => {
  it('commits folder assignment and dispatches folderSetComplete', async () => {
    const tx = mockTransactionCommit(undefined)
    const client = createMockSanityClient({
      transaction: vi.fn(() => tx),
    })

    const store = createEpicTestStore(assetsFolderSetEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {a1: assetItem},
      },
    })

    store.dispatch(
      assetsActions.folderSetRequest({
        assets: [assetItem],
        folderId: 'folder-1',
      }),
    )

    await vi.waitFor(() => {
      expect(tx.patch).toHaveBeenCalledWith('a1', expect.any(Function))
      expect(tx.commit).toHaveBeenCalled()
      expect(store.getState().assets.byIds['a1']?.updating).toBe(false)
    })
  })

  it('unsets folder when folderId is null', async () => {
    const tx = mockTransactionCommit(undefined)
    const client = createMockSanityClient({
      transaction: vi.fn(() => tx),
    })

    const store = createEpicTestStore(assetsFolderSetEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {a1: assetItem},
      },
    })

    store.dispatch(
      assetsActions.folderSetRequest({
        assets: [assetItem],
        folderId: null,
      }),
    )

    await vi.waitFor(() => {
      expect(tx.commit).toHaveBeenCalled()
    })

    const ops = tx.patchChain
    expect(ops.unset).toHaveBeenCalledWith(['opt.media.folder'])
  })
})

describe('assetsFolderSetRefreshEpic', () => {
  it('clears picks and reloads page 0 after folder set completes', async () => {
    const client = createMockSanityClient()
    const store = createEpicTestStore(assetsFolderSetRefreshEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {a1: {...assetItem, picked: true}},
        pageIndex: 2,
      },
    })

    store.dispatch(
      assetsActions.folderSetComplete({
        assetIds: ['a1'],
        folderId: 'folder-1',
      }),
    )

    await vi.waitFor(() => {
      expect(store.getState().assets.byIds['a1']?.picked).toBe(false)
      expect(store.getState().assets.pageIndex).toBe(0)
    })
  })
})

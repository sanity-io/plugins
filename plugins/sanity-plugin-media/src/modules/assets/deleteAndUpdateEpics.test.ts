// @vitest-environment node

import {of, throwError} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createEpicTestStore} from '../../__tests__/fixtures/createEpicTestStore'
import {
  createMockSanityClient,
  mockPatchChain,
  mockTransactionCommit,
} from '../../__tests__/fixtures/mockSanityClient'
import type {ImageAsset} from '../../types'
import {
  assetsActions,
  assetsDeleteEpic,
  assetsUpdateEpic,
  assetsUpdateImageReferencesEpic,
  initialState as assetsInitialState,
} from './index'

const sampleAsset = {
  _id: 'a1',
  _type: 'sanity.imageAsset',
  _createdAt: '',
  _updatedAt: '',
  _rev: 'r',
  originalFilename: 'x.png',
  size: 1,
  mimeType: 'image/png',
  url: '',
} as ImageAsset

describe('assetsDeleteEpic', () => {
  it('dispatches deleteComplete when observable.delete succeeds', async () => {
    const client = createMockSanityClient({
      observable: {
        delete: vi.fn(() => of({})),
      },
    })

    const store = createEpicTestStore(assetsDeleteEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {
          a1: {_type: 'asset', asset: sampleAsset, picked: false, updating: false},
        },
      },
    })

    store.dispatch(assetsActions.deleteRequest({assets: [sampleAsset]}))

    await vi.waitFor(() => {
      expect(store.getState().assets.byIds['a1']).toBeUndefined()
      expect(client.observable.delete).toHaveBeenCalled()
    })
  })
})

describe('assetsUpdateEpic', () => {
  it('commits patch and dispatches updateComplete', async () => {
    const updated = {...sampleAsset, title: 'Updated'}
    const chain = mockPatchChain(updated)
    const client = createMockSanityClient({
      patch: vi.fn(() => chain),
    })

    const store = createEpicTestStore(assetsUpdateEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {
          a1: {_type: 'asset', asset: sampleAsset, picked: false, updating: false},
        },
      },
    })

    store.dispatch(
      assetsActions.updateRequest({
        asset: sampleAsset,
        formData: {title: 'Updated'},
      }),
    )

    await vi.waitFor(() => {
      expect(chain.commit).toHaveBeenCalled()
      expect(store.getState().assets.byIds['a1']!.asset.title).toBe('Updated')
    })
  })
})

describe('assetsUpdateImageReferencesEpic', () => {
  it('patches referencing documents in a transaction and completes', async () => {
    const referencingDocument = {
      _id: 'doc-1',
      _rev: 'rev-1',
      _type: 'post',
      hero: {_type: 'image', asset: {_ref: 'a1', _type: 'reference'}},
    }
    const tx = mockTransactionCommit({})
    const client = createMockSanityClient({
      observable: {
        fetch: vi.fn(() => of([referencingDocument])),
      },
      transaction: vi.fn(() => tx),
    })

    const replacementAsset = {...sampleAsset, _id: 'a2'}

    const store = createEpicTestStore(assetsUpdateImageReferencesEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {
          a1: {_type: 'asset', asset: sampleAsset, picked: true, updating: false},
        },
        lastPicked: 'a1',
      },
    })

    store.dispatch(assetsActions.updateImageReferences({asset: replacementAsset, id: 'a1'}))

    await vi.waitFor(() => {
      expect(client.observable.fetch).toHaveBeenCalled()
      expect(client.transaction).toHaveBeenCalled()
      expect(tx.patch).toHaveBeenCalledWith('doc-1', expect.any(Function))
      expect(tx.patchChain.ifRevisionId).toHaveBeenCalledWith('rev-1')
      expect(tx.patchChain.set).toHaveBeenCalledWith({
        hero: {_type: 'image', asset: {_ref: 'a2', _type: 'reference'}},
      })
      expect(tx.commit).toHaveBeenCalledTimes(1)
      expect(store.getState().assets.byIds['a1']!.updating).toBe(false)
    })
  })

  it('merges multi-field patches into a single transaction patch per document', async () => {
    const referencingDocument = {
      _id: 'doc-1',
      _rev: 'rev-1',
      _type: 'post',
      hero: {_type: 'image', asset: {_ref: 'a1', _type: 'reference'}},
      thumb: {_type: 'image', asset: {_ref: 'a1', _type: 'reference'}},
    }
    const tx = mockTransactionCommit({})
    const client = createMockSanityClient({
      observable: {
        fetch: vi.fn(() => of([referencingDocument])),
      },
      transaction: vi.fn(() => tx),
    })

    const replacementAsset = {...sampleAsset, _id: 'a2'}

    const store = createEpicTestStore(assetsUpdateImageReferencesEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {
          a1: {_type: 'asset', asset: sampleAsset, picked: true, updating: false},
        },
      },
    })

    store.dispatch(assetsActions.updateImageReferences({asset: replacementAsset, id: 'a1'}))

    await vi.waitFor(() => {
      expect(tx.patch).toHaveBeenCalledTimes(1)
      expect(tx.patchChain.set).toHaveBeenCalledWith({
        hero: {_type: 'image', asset: {_ref: 'a2', _type: 'reference'}},
        thumb: {_type: 'image', asset: {_ref: 'a2', _type: 'reference'}},
      })
      expect(tx.commit).toHaveBeenCalledTimes(1)
      expect(store.getState().assets.byIds['a1']!.updating).toBe(false)
    })
  })

  it('on error clears the spinner and sets the error on the original asset, not the replacement', async () => {
    const client = createMockSanityClient({
      observable: {
        fetch: vi.fn(() => throwError(() => ({message: 'boom', statusCode: 500}))),
      },
    })

    const replacementAsset = {...sampleAsset, _id: 'a2'}

    const store = createEpicTestStore(assetsUpdateImageReferencesEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1', 'a2'],
        byIds: {
          a1: {_type: 'asset', asset: sampleAsset, picked: true, updating: false},
          a2: {_type: 'asset', asset: replacementAsset, picked: false, updating: false},
        },
        lastPicked: 'a1',
      },
    })

    store.dispatch(assetsActions.updateImageReferences({asset: replacementAsset, id: 'a1'}))

    await vi.waitFor(() => {
      const {byIds} = store.getState().assets
      // Original asset: spinner cleared and error attached
      expect(byIds['a1']!.updating).toBe(false)
      expect(byIds['a1']!.error).toBe('boom')
      // Replacement asset is untouched
      expect(byIds['a2']!.updating).toBe(false)
      expect(byIds['a2']!.error).toBeUndefined()
    })
  })

  it('completes without committing when no referencing documents need patches', async () => {
    const tx = mockTransactionCommit({})
    const client = createMockSanityClient({
      observable: {
        fetch: vi.fn(() => of([])),
      },
      transaction: vi.fn(() => tx),
    })

    const replacementAsset = {...sampleAsset, _id: 'a2'}
    const store = createEpicTestStore(assetsUpdateImageReferencesEpic, client, {
      assets: {
        ...assetsInitialState,
        assetTypes: ['image'],
        allIds: ['a1'],
        byIds: {
          a1: {_type: 'asset', asset: sampleAsset, picked: true, updating: false},
        },
      },
    })

    store.dispatch(assetsActions.updateImageReferences({asset: replacementAsset, id: 'a1'}))

    await vi.waitFor(() => {
      expect(tx.commit).not.toHaveBeenCalled()
      expect(store.getState().assets.byIds['a1']!.updating).toBe(false)
    })
  })
})

// @vitest-environment node

import {of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createEpicTestStore} from '../../__tests__/fixtures/createEpicTestStore'
import {createMockSanityClient, mockPatchChain} from '../../__tests__/fixtures/mockSanityClient'
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
  it('patches referencing documents and dispatches updateImageReferencesComplete', async () => {
    const referencingDocument = {
      _id: 'doc-1',
      _type: 'post',
      hero: {_type: 'image', asset: {_ref: 'a1', _type: 'reference'}},
    }
    const chain = mockPatchChain({})
    const client = createMockSanityClient({
      observable: {
        fetch: vi.fn(() => of([referencingDocument])),
      },
      patch: vi.fn(() => chain),
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
      expect(client.patch).toHaveBeenCalledWith('doc-1')
      expect(chain.set).toHaveBeenCalledWith({
        hero: {_type: 'image', asset: {_ref: 'a2', _type: 'reference'}},
      })
      expect(chain.commit).toHaveBeenCalled()
      expect(store.getState().assets.byIds.a1.updating).toBe(false)
    })
  })
})

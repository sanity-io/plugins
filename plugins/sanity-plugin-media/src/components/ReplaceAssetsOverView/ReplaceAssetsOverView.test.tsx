import {act, cleanup, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {renderWithProviders} from '../../__tests__/fixtures/renderWithProviders'
import {inputs} from '../../config/searchFacets'
import {assetsActions, initialState as assetsInitialState} from '../../modules/assets'
import type {AssetItem, AssetType, FileAsset, ImageAsset} from '../../types'
import ReplaceAssetsOverview from './index'

vi.mock('../AssetGridVirtualized', () => ({
  default: ({items}: {items: {id: string; type: string}[]}) => (
    <div data-testid="replace-grid">
      {items.map((item) => (
        <div key={item.id} data-testid={`replace-item-${item.id}`} data-type={item.type} />
      ))}
    </div>
  ),
}))

const imageAsset = {
  _id: 'img-1',
  _type: 'sanity.imageAsset',
  _createdAt: '',
  _updatedAt: '',
  _rev: 'r1',
  originalFilename: 'photo.png',
  size: 1,
  mimeType: 'image/png',
  url: 'https://example.com/photo.png',
  metadata: {dimensions: {width: 100, height: 100}, isOpaque: true},
} as ImageAsset

const replacementImage = {
  ...imageAsset,
  _id: 'img-2',
  originalFilename: 'other.png',
} as ImageAsset

const fileAsset = {
  _id: 'file-1',
  _type: 'sanity.fileAsset',
  _createdAt: '',
  _updatedAt: '',
  _rev: 'r1',
  originalFilename: 'doc.pdf',
  extension: 'pdf',
  size: 1,
  mimeType: 'application/pdf',
  url: 'https://example.com/doc.pdf',
} as FileAsset

function assetItem(asset: ImageAsset | FileAsset, partial?: Partial<AssetItem>): AssetItem {
  return {
    _type: 'asset',
    asset,
    picked: false,
    updating: false,
    ...partial,
  }
}

function assetsState(byIds: Record<string, AssetItem>, extra?: Partial<typeof assetsInitialState>) {
  return {
    ...assetsInitialState,
    assetTypes: ['file', 'image'] as AssetType[],
    allIds: Object.keys(byIds),
    byIds,
    fetchCount: Object.keys(byIds).length,
    ...extra,
  }
}

describe('ReplaceAssetsOverview', () => {
  afterEach(() => {
    cleanup()
  })

  it('lists only other image assets as replace candidates', () => {
    renderWithProviders(<ReplaceAssetsOverview />, {
      preloaded: {
        assets: assetsState(
          {
            'img-1': assetItem(imageAsset, {picked: true}),
            'img-2': assetItem(replacementImage),
            'file-1': assetItem(fileAsset),
          },
          {lastPicked: undefined},
        ),
        dialog: {
          items: [{assetId: 'img-1', id: 'dialogAllAssets', type: 'dialogAllAssets'}],
        },
        uploads: {
          allIds: ['upload-1'],
          byIds: {},
        },
      },
    })

    expect(screen.getByTestId('replace-item-img-2')).toBeTruthy()
    expect(screen.queryByTestId('replace-item-img-1')).toBeNull()
    expect(screen.queryByTestId('replace-item-file-1')).toBeNull()
    expect(screen.queryByTestId('replace-item-upload-1')).toBeNull()
  })

  it('excludes the dialog target even when lastPicked is stale/cleared', () => {
    renderWithProviders(<ReplaceAssetsOverview />, {
      preloaded: {
        assets: assetsState(
          {
            'img-1': assetItem(imageAsset, {picked: true}),
            'img-2': assetItem(replacementImage),
          },
          {lastPicked: undefined},
        ),
        dialog: {
          items: [{assetId: 'img-1', id: 'dialogAllAssets', type: 'dialogAllAssets'}],
        },
      },
    })

    expect(screen.queryByTestId('replace-item-img-1')).toBeNull()
    expect(screen.getByTestId('replace-item-img-2')).toBeTruthy()
  })

  it('shows empty state when the only image is the one being replaced', () => {
    renderWithProviders(<ReplaceAssetsOverview />, {
      preloaded: {
        assets: assetsState({
          'img-1': assetItem(imageAsset, {picked: true}),
          'file-1': assetItem(fileAsset),
        }),
        dialog: {
          items: [{assetId: 'img-1', id: 'dialogAllAssets', type: 'dialogAllAssets'}],
        },
      },
    })

    expect(screen.getByText('There are no replacement images')).toBeTruthy()
    expect(screen.queryByTestId('replace-grid')).toBeNull()
  })

  it('clears the browser search and facets on open', () => {
    const {store} = renderWithProviders(<ReplaceAssetsOverview />, {
      preloaded: {
        assets: assetsState({'img-1': assetItem(imageAsset, {picked: true})}),
        dialog: {
          items: [{assetId: 'img-1', id: 'dialogAllAssets', type: 'dialogAllAssets'}],
        },
        search: {facets: [{...inputs.title, id: 'facet-1'}], query: 'photo'},
      },
    })

    expect(store.getState().search.query).toBe('')
    expect(store.getState().search.facets).toHaveLength(0)
  })

  it('restores the search and the cleared pick when the dialog closes', () => {
    const facet = {...inputs.title, id: 'facet-1'}
    const {store, unmount} = renderWithProviders(<ReplaceAssetsOverview />, {
      preloaded: {
        // `assetsUnpickEpic` clears picks whenever the search changes.
        assets: assetsState({'img-1': assetItem(imageAsset, {picked: false})}),
        dialog: {
          items: [{assetId: 'img-1', id: 'dialogAllAssets', type: 'dialogAllAssets'}],
        },
        search: {facets: [facet], query: 'photo'},
      },
    })

    unmount()

    expect(store.getState().search.query).toBe('photo')
    expect(store.getState().search.facets).toHaveLength(1)
    expect(store.getState().search.facets[0]!.name).toBe('title')
    expect(store.getState().assets.byIds['img-1']!.picked).toBe(true)
  })

  it('leaves the pick alone when no filters were active', () => {
    const {store, unmount} = renderWithProviders(<ReplaceAssetsOverview />, {
      preloaded: {
        assets: assetsState({'img-1': assetItem(imageAsset, {picked: true})}),
        dialog: {
          items: [{assetId: 'img-1', id: 'dialogAllAssets', type: 'dialogAllAssets'}],
        },
      },
    })

    unmount()

    expect(store.getState().search.query).toBe('')
    expect(store.getState().search.facets).toHaveLength(0)
    expect(store.getState().assets.byIds['img-1']!.picked).toBe(true)
  })

  it('does not flash the empty state while the unfiltered refetch is pending', () => {
    renderWithProviders(<ReplaceAssetsOverview />, {
      preloaded: {
        // Filtered page held only the asset being replaced, and was a partial page.
        assets: assetsState({'img-1': assetItem(imageAsset, {picked: true})}),
        dialog: {
          items: [{assetId: 'img-1', id: 'dialogAllAssets', type: 'dialogAllAssets'}],
        },
        search: {facets: [], query: 'photo'},
      },
    })

    expect(screen.queryByText('There are no replacement images')).toBeNull()
  })

  it('shows the empty state once the unfiltered refetch completes with no candidates', () => {
    const {store} = renderWithProviders(<ReplaceAssetsOverview />, {
      preloaded: {
        assets: assetsState({'img-1': assetItem(imageAsset, {picked: true})}),
        dialog: {
          items: [{assetId: 'img-1', id: 'dialogAllAssets', type: 'dialogAllAssets'}],
        },
        search: {facets: [], query: 'photo'},
      },
    })

    expect(screen.queryByText('There are no replacement images')).toBeNull()

    act(() => {
      store.dispatch(assetsActions.clear())
      store.dispatch(assetsActions.fetchRequest({queryFilter: ''}))
      store.dispatch(assetsActions.fetchComplete({assets: [imageAsset]}))
    })

    expect(screen.getByText('There are no replacement images')).toBeTruthy()
  })

  it('loads the next page while a full page holds no replacement candidates', () => {
    const actions: {type: string}[] = []
    renderWithProviders(<ReplaceAssetsOverview />, {
      onAction: (action) => actions.push(action),
      preloaded: {
        assets: assetsState(
          {'img-1': assetItem(imageAsset, {picked: true})},
          {fetchCount: assetsInitialState.pageSize},
        ),
        dialog: {
          items: [{assetId: 'img-1', id: 'dialogAllAssets', type: 'dialogAllAssets'}],
        },
      },
    })

    expect(actions.some((action) => action.type === assetsActions.loadNextPage.type)).toBe(true)
  })

  it('stops paging when the last fetch failed', () => {
    const actions: {type: string}[] = []
    renderWithProviders(<ReplaceAssetsOverview />, {
      onAction: (action) => actions.push(action),
      preloaded: {
        assets: assetsState(
          {'img-1': assetItem(imageAsset, {picked: true})},
          {
            fetchCount: assetsInitialState.pageSize,
            fetchingError: {message: 'Internal error', statusCode: 500},
          },
        ),
        dialog: {
          items: [{assetId: 'img-1', id: 'dialogAllAssets', type: 'dialogAllAssets'}],
        },
      },
    })

    expect(actions.some((action) => action.type === assetsActions.loadNextPage.type)).toBe(false)
  })

  it('excludes the replace target from dialog assetId even when picks were cleared', () => {
    renderWithProviders(<ReplaceAssetsOverview />, {
      preloaded: {
        assets: assetsState({
          'img-1': assetItem(imageAsset, {picked: false}),
          'img-2': assetItem(replacementImage),
        }),
        dialog: {
          items: [{assetId: 'img-1', id: 'dialogAllAssets', type: 'dialogAllAssets'}],
        },
      },
    })

    expect(screen.queryByTestId('replace-item-img-1')).toBeNull()
    expect(screen.getByTestId('replace-item-img-2')).toBeTruthy()
  })
})

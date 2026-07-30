import {cleanup, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {renderWithProviders} from '../../__tests__/fixtures/renderWithProviders'
import {initialState as assetsInitialState} from '../../modules/assets'
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

  it('excludes the picked asset even when lastPicked is stale/cleared', () => {
    renderWithProviders(<ReplaceAssetsOverview />, {
      preloaded: {
        assets: assetsState(
          {
            'img-1': assetItem(imageAsset, {picked: true}),
            'img-2': assetItem(replacementImage),
          },
          {lastPicked: undefined},
        ),
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
      },
    })

    expect(screen.getByText('There are no replacement images')).toBeTruthy()
    expect(screen.queryByTestId('replace-grid')).toBeNull()
  })
})

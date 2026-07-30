import {cleanup, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {renderWithProviders} from '../../__tests__/fixtures/renderWithProviders'
import {initialState as assetsInitialState} from '../../modules/assets'
import type {AssetItem, AssetType, FileAsset, ImageAsset} from '../../types'
import PickedBar from './index'

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useColorSchemeValue: () => 'light',
  }
})

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
    ...extra,
  }
}

describe('PickedBar', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders nothing when no assets are picked', () => {
    renderWithProviders(<PickedBar />, {
      preloaded: {
        assets: assetsState({'img-1': assetItem(imageAsset)}),
      },
    })
    expect(screen.queryByText(/selected/i)).toBeNull()
  })

  it('shows Replace when exactly one image asset is picked', async () => {
    const user = userEvent.setup()
    const {store} = renderWithProviders(<PickedBar />, {
      preloaded: {
        assets: assetsState({'img-1': assetItem(imageAsset, {picked: true})}),
      },
    })

    expect(screen.getByText('Replace')).toBeTruthy()
    await user.click(screen.getByText('Replace'))
    expect(store.getState().dialog.items.some((d) => d.type === 'dialogAllAssets')).toBe(true)
  })

  it('hides Replace when the only picked asset is a file', () => {
    renderWithProviders(<PickedBar />, {
      preloaded: {
        assets: assetsState({'file-1': assetItem(fileAsset, {picked: true})}),
      },
    })

    expect(screen.getByText(/1 asset selected/i)).toBeTruthy()
    expect(screen.queryByText('Replace')).toBeNull()
  })

  it('hides Replace when more than one asset is picked', () => {
    const second = {...imageAsset, _id: 'img-2', originalFilename: 'other.png'} as ImageAsset
    renderWithProviders(<PickedBar />, {
      preloaded: {
        assets: assetsState({
          'img-1': assetItem(imageAsset, {picked: true}),
          'img-2': assetItem(second, {picked: true}),
        }),
      },
    })

    expect(screen.getByText(/2 assets selected/i)).toBeTruthy()
    expect(screen.queryByText('Replace')).toBeNull()
  })
})

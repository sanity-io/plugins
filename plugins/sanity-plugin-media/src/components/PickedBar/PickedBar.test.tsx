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
    expect(store.getState().dialog.items.find((d) => d.type === 'dialogAllAssets')).toMatchObject({
      assetId: 'img-1',
    })
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

  it('clears picks when Deselect is clicked', async () => {
    const user = userEvent.setup()
    const {store} = renderWithProviders(<PickedBar />, {
      preloaded: {
        assets: assetsState({'img-1': assetItem(imageAsset, {picked: true})}),
      },
    })

    await user.click(screen.getByText('Deselect'))
    expect(store.getState().assets.byIds['img-1']?.picked).toBe(false)
  })

  it('opens confirm-delete dialog when Delete is clicked', async () => {
    const user = userEvent.setup()
    const {store} = renderWithProviders(<PickedBar />, {
      preloaded: {
        assets: assetsState({'img-1': assetItem(imageAsset, {picked: true})}),
      },
    })

    await user.click(screen.getByText('Delete'))
    expect(store.getState().dialog.items.some((d) => d.type === 'confirm')).toBe(true)
  })

  it('opens folder-move dialog when Move to folder is clicked', async () => {
    const user = userEvent.setup()
    const {store} = renderWithProviders(<PickedBar />, {
      preloaded: {
        assets: assetsState({'img-1': assetItem(imageAsset, {picked: true})}),
        folders: {
          byId: {},
          childrenByParentId: {},
          rootIds: [],
          exactCountByFolderId: {},
          unfiledCount: 0,
          currentFolderId: null,
          currentFolderUnfiled: false,
          panelVisible: false,
          fetching: false,
          fetchCount: -1,
          creating: false,
          renaming: false,
        },
      },
    })

    await user.click(screen.getByText('Move to folder'))
    expect(store.getState().dialog.items.some((d) => d.type === 'folderMove')).toBe(true)
  })

  it('dispatches folderSetRequest(null) when Remove from folder is clicked', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    renderWithProviders(<PickedBar />, {
      onAction,
      preloaded: {
        assets: assetsState({'img-1': assetItem(imageAsset, {picked: true})}),
        folders: {
          byId: {f1: {_id: 'f1', name: 'F', parentId: null}},
          childrenByParentId: {},
          rootIds: ['f1'],
          exactCountByFolderId: {},
          unfiledCount: 0,
          currentFolderId: 'f1',
          currentFolderUnfiled: false,
          panelVisible: true,
          fetching: false,
          fetchCount: 1,
          creating: false,
          renaming: false,
        },
      },
    })

    await user.click(screen.getByText('Remove from folder'))
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'assets/folderSetRequest',
        payload: expect.objectContaining({folderId: null}),
      }),
    )
  })

  it('calls onSelect with picked assets when Insert selected is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderWithProviders(<PickedBar />, {
      isMultiSelect: true,
      onSelect,
      preloaded: {
        assets: assetsState({'img-1': assetItem(imageAsset, {picked: true})}),
      },
    })

    await user.click(screen.getByText('Insert selected'))
    expect(onSelect).toHaveBeenCalledWith([{kind: 'assetDocumentId', value: 'img-1'}])
  })
})

import {cleanup, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import copy from 'copy-to-clipboard'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {renderWithProviders} from '../../__tests__/fixtures/renderWithProviders'
import type {AssetItem, FileAsset, ImageAsset} from '../../types'
import AssetMetadata from './index'

vi.mock('copy-to-clipboard', () => ({default: vi.fn(() => true)}))

const imageAsset = {
  _id: 'image-abc123-800x600-png',
  _type: 'sanity.imageAsset',
  _createdAt: '2024-06-01T12:00:00.000Z',
  _updatedAt: '2024-06-01T12:00:00.000Z',
  _rev: 'r1',
  originalFilename: 'photo.png',
  extension: 'png',
  size: 2048,
  mimeType: 'image/png',
  url: 'https://cdn.sanity.io/images/proj/dataset/abc123-800x600.png',
  metadata: {dimensions: {width: 800, height: 600}, isOpaque: true},
} as ImageAsset

const fileAsset = {
  _id: 'file-def456-pdf',
  _type: 'sanity.fileAsset',
  _createdAt: '2024-06-01T12:00:00.000Z',
  _updatedAt: '2024-06-01T12:00:00.000Z',
  _rev: 'r1',
  originalFilename: 'brief.pdf',
  extension: 'pdf',
  size: 4096,
  mimeType: 'application/pdf',
  url: 'https://cdn.sanity.io/files/proj/dataset/def456.pdf',
} as FileAsset

function item(asset: ImageAsset | FileAsset, partial?: Partial<AssetItem>): AssetItem {
  return {_type: 'asset', asset, picked: false, updating: false, ...partial}
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AssetMetadata', () => {
  it('shows the image asset id and copies it', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AssetMetadata asset={imageAsset} item={item(imageAsset)} />)

    expect(screen.getByText('Asset ID')).toBeInTheDocument()
    expect(screen.getByText(imageAsset._id)).toBeInTheDocument()

    await user.click(screen.getByRole('button', {name: 'Copy ID'}))
    expect(copy).toHaveBeenCalledWith(imageAsset._id)
    expect(await screen.findByRole('button', {name: 'Copied!'})).toBeInTheDocument()
  })

  it('shows the file asset id and still copies the asset url', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AssetMetadata asset={fileAsset} item={item(fileAsset)} />)

    expect(screen.getByText(fileAsset._id)).toBeInTheDocument()

    await user.click(screen.getByRole('button', {name: 'Copy URL'}))
    expect(copy).toHaveBeenCalledWith(fileAsset.url)
  })

  it('disables copy actions while the asset is updating', () => {
    renderWithProviders(
      <AssetMetadata asset={imageAsset} item={item(imageAsset, {updating: true})} />,
    )

    expect(screen.getByRole('button', {name: 'Copy ID'})).toBeDisabled()
    expect(screen.getByRole('button', {name: 'Copy URL'})).toBeDisabled()
    expect(screen.getByRole('button', {name: 'Download'})).toBeDisabled()
  })
})

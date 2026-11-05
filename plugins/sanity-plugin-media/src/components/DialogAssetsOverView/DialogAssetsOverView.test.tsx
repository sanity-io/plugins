import {cleanup, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {of} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../__tests__/fixtures/mockSanityClient'
import {renderWithProviders} from '../../__tests__/fixtures/renderWithProviders'
import {createTestRootState} from '../../__tests__/fixtures/rootState'
import type {AssetItem, DialogAllAssetsProps, ImageAsset} from '../../types'
import DialogAllAssets from './index'

const {fetchMock} = vi.hoisted(() => ({fetchMock: vi.fn()}))

vi.mock('../../hooks/useVersionedClient', () => {
  // `useClient` returns a stable client; a new one per render would refetch forever.
  const client = createMockSanityClient({observable: {fetch: fetchMock}})
  return {default: () => client}
})

vi.mock('../ReplacementAssetGrid', () => ({
  default: ({items, onSelect}: {items: ImageAsset[]; onSelect: (asset: ImageAsset) => void}) => (
    <div>
      {items.map((item) => (
        <button key={item._id} onClick={() => onSelect(item)} type="button">
          {item.originalFilename}
        </button>
      ))}
    </div>
  ),
}))

function image(id: string): ImageAsset {
  return {
    _id: id,
    _type: 'sanity.imageAsset',
    originalFilename: `${id}.png`,
    url: `https://cdn.example.com/${id}.png`,
    metadata: {dimensions: {height: 600, width: 800}, isOpaque: true},
  } as ImageAsset
}

const original = image('image-original')
const dialog: DialogAllAssetsProps = {
  assetId: original._id,
  id: 'dialogAllAssets',
  type: 'dialogAllAssets',
}

function renderDialog(originalItem: Partial<AssetItem> = {}) {
  const base = createTestRootState()
  return renderWithProviders(
    <DialogAllAssets dialog={dialog}>
      <span />
    </DialogAllAssets>,
    {
      preloaded: {
        assets: {
          ...base.assets,
          allIds: [original._id],
          byIds: {
            [original._id]: {
              _type: 'asset',
              asset: original,
              picked: true,
              updating: false,
              ...originalItem,
            },
          },
        },
        dialog: {items: [dialog]},
      },
    },
  )
}

describe('DialogAllAssets', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockImplementation((query: string) =>
      query.startsWith('count(') ? of(3) : of([image('image-new')]),
    )
  })

  afterEach(() => {
    cleanup()
  })

  it('asks for confirmation before replacing', async () => {
    const user = userEvent.setup()
    const {store} = renderDialog()

    await user.click(await screen.findByText('image-new.png'))

    expect(await screen.findByText(/3 documents use the current image/)).toBeTruthy()
    expect(screen.getByText('image-original.png')).toBeTruthy()
    // Nothing is rewritten until the replacement is confirmed.
    expect(store.getState().assets.byIds[original._id]!.updating).toBe(false)
    expect(store.getState().dialog.items).toHaveLength(1)

    await user.click(screen.getByRole('button', {name: 'Replace image'}))

    expect(store.getState().assets.byIds[original._id]!.updating).toBe(true)
    expect(store.getState().dialog.items).toHaveLength(0)
  })

  it('returns to the picker with the search kept when going back', async () => {
    const user = userEvent.setup()
    const {store} = renderDialog()

    await user.type(screen.getByRole('textbox', {name: 'Search images'}), 'new')
    await user.click(await screen.findByText('image-new.png'))
    await user.click(await screen.findByRole('button', {name: 'Back'}))

    expect(screen.getByRole<HTMLInputElement>('textbox', {name: 'Search images'}).value).toBe('new')
    expect(store.getState().assets.byIds[original._id]!.updating).toBe(false)
  })

  it('does not start a second replace while the original is still updating', async () => {
    const user = userEvent.setup()
    const {store} = renderDialog({updating: true})

    await user.click(await screen.findByText('image-new.png'))

    const replaceButton = await screen.findByRole('button', {name: 'Replace image'})
    expect(replaceButton.hasAttribute('disabled')).toBe(true)
    expect(store.getState().dialog.items).toHaveLength(1)
  })
})

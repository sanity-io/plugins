import {act, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {assetItem, fileAsset, imageAsset} from '../../__tests__/fixtures/documents'
import {renderWithMedia} from '../../__tests__/fixtures/renderWithMedia'
import {selectPickedAssets} from '../../machines/assetsMachine'
import {
  confirmDeleteAssetsDialog,
  folderMoveDialog,
  replaceAssetDialog,
} from '../../machines/dialogs'
import type {Asset} from '../../types'
import PickedBar from './index'

const photo = imageAsset('img-1')
const other = imageAsset('img-2')
const pdf = fileAsset('file-1')

async function renderPickedBar({
  assets = [photo, other, pdf],
  picked,
  ...options
}: Parameters<typeof renderWithMedia>[1] & {picked: string[]}) {
  const result = await renderWithMedia(<PickedBar />, {assets, ...options})
  act(() => {
    for (const assetId of picked) {
      result.actors.assets.send({type: 'pick.toggle', assetId})
    }
  })
  return result
}

const pickedItems = (...assets: Asset[]) => assets.map((asset) => assetItem(asset, {picked: true}))

describe('PickedBar', () => {
  it('only shows while assets are picked', async () => {
    const {actors} = await renderPickedBar({picked: []})
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument()

    act(() => actors.assets.send({type: 'pick.all'}))
    expect(screen.getByText('3 assets selected')).toBeInTheDocument()

    act(() => actors.assets.send({type: 'pick.clear'}))
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument()
  })

  it('clears picks when Deselect is clicked', async () => {
    const user = userEvent.setup()
    const {actors} = await renderPickedBar({picked: ['img-1']})

    await user.click(screen.getByText('Deselect'))

    expect(selectPickedAssets(actors.assets.getSnapshot())).toEqual([])
  })

  it('confirms before deleting the picked assets', async () => {
    const user = userEvent.setup()
    const {actors} = await renderPickedBar({picked: ['img-1', 'file-1']})

    await user.click(screen.getByText('Delete'))

    expect(actors.dialogs.getSnapshot().context.items).toEqual([
      confirmDeleteAssetsDialog(pickedItems(photo, pdf)),
    ])
  })

  describe('replacing', () => {
    it('replaces the only picked image, browsing the whole library for its replacement', async () => {
      const user = userEvent.setup()
      const {actors} = await renderPickedBar({picked: ['img-1']})

      await user.click(screen.getByText('Replace'))

      expect(actors.dialogs.getSnapshot().context.items).toEqual([replaceAssetDialog('img-1')])
      expect(actors.assets.getSnapshot().context.replace).toEqual({assetId: 'img-1'})
    })

    it('cannot replace files, which fields reference differently', async () => {
      await renderPickedBar({picked: ['file-1']})

      expect(screen.getByText('1 asset selected')).toBeInTheDocument()
      expect(screen.queryByText('Replace')).not.toBeInTheDocument()
    })

    it('cannot replace several assets at once', async () => {
      await renderPickedBar({picked: ['img-1', 'img-2']})

      expect(screen.getByText('2 assets selected')).toBeInTheDocument()
      expect(screen.queryByText('Replace')).not.toBeInTheDocument()
    })
  })

  describe('folders', () => {
    it('moves the picked assets to a folder picked in a dialog', async () => {
      const user = userEvent.setup()
      const {actors} = await renderPickedBar({picked: ['img-1']})

      await user.click(screen.getByText('Move to folder'))

      expect(actors.dialogs.getSnapshot().context.items).toEqual([
        folderMoveDialog(pickedItems(photo), null),
      ])
      expect(screen.queryByText('Remove from folder')).not.toBeInTheDocument()
    })

    it('removes the picked assets from the current folder', async () => {
      const user = userEvent.setup()
      const {actors} = await renderPickedBar({
        folders: [{_id: 'f1', name: 'Campaigns', parentId: null}],
        picked: [],
      })
      act(() => actors.assets.send({type: 'folder.open', folderId: 'f1'}))
      await waitFor(() => expect(actors.assets.getSnapshot().context.allIds).toHaveLength(3))
      act(() => actors.assets.send({type: 'pick.toggle', assetId: 'img-1'}))
      const send = vi.spyOn(actors.assets, 'send')

      await user.click(screen.getByText('Remove from folder'))

      expect(send).toHaveBeenCalledExactlyOnceWith({
        type: 'assets.folder.set',
        assets: pickedItems(photo),
        folderId: null,
      })
    })
  })

  describe('picking assets for a field', () => {
    it('inserts the picked assets when the field accepts several', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      await renderPickedBar({isMultiSelect: true, onSelect, picked: ['img-1', 'file-1']})

      await user.click(screen.getByText('Insert selected'))

      expect(onSelect).toHaveBeenCalledWith([
        {kind: 'assetDocumentId', value: 'img-1'},
        {kind: 'assetDocumentId', value: 'file-1'},
      ])
      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
      expect(screen.queryByText('Move to folder')).not.toBeInTheDocument()
    })
  })
})

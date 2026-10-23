import {act, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {fileAsset, imageAsset} from '../../__tests__/fixtures/documents'
import {createMediaFetchMock} from '../../__tests__/fixtures/mediaFetchMock'
import {deferred} from '../../__tests__/fixtures/mockSanityClient'
import {renderWithMedia} from '../../__tests__/fixtures/renderWithMedia'
import {selectPickedAssets} from '../../machines/assetsMachine'
import {replaceAssetDialog} from '../../machines/dialogs'
import type {Asset} from '../../types'
import ReplaceAssetsOverview from './index'

vi.mock('../AssetGridVirtualized', () => ({
  default: ({items}: {items: {id: string}[]}) => (
    <ul data-testid="replace-grid">
      {items.map((item) => (
        <li key={item.id}>{item.id}</li>
      ))}
    </ul>
  ),
}))

const target = imageAsset('img-1')
const replacement = imageAsset('img-2')
const pdf = fileAsset('file-1')

const listedIds = () =>
  Array.from(screen.queryByTestId('replace-grid')?.querySelectorAll('li') ?? [], (item) =>
    String(item.textContent),
  )
const emptyState = () => screen.queryByText('There are no replacement images')

async function openReplaceDialog(assets: Asset[], {folders = [] as {_id: string}[]} = {}) {
  const result = await renderWithMedia(<ReplaceAssetsOverview />, {
    assets,
    folders: folders.map(({_id}) => ({_id, name: _id, parentId: null})),
  })
  const open = () =>
    act(() =>
      result.actors.dialogs.send({type: 'dialog.open', dialog: replaceAssetDialog('img-1')}),
    )
  return {...result, open}
}

describe('ReplaceAssetsOverview', () => {
  it('lists the other images as replacement candidates', async () => {
    const {open} = await openReplaceDialog([target, replacement, pdf])

    open()

    expect(listedIds()).toEqual(['img-2'])
  })

  it('browses the whole library while open, then restores the browse scope', async () => {
    const {actors, client, open} = await openReplaceDialog([target, replacement], {
      folders: [{_id: 'f1'}],
    })
    act(() => actors.assets.send({type: 'folder.open', folderId: 'f1'}))
    await waitFor(() => expect(actors.assets.getSnapshot().matches({fetch: 'idle'})).toBe(true))
    act(() => actors.assets.send({type: 'pick.toggle', assetId: 'img-1'}))
    client.fetch.mockClear()

    open()

    expect(actors.assets.getSnapshot().context.currentFolderId).toBeNull()
    expect(String(client.fetch.mock.lastCall?.[0])).not.toContain('opt.media.folder')
    await waitFor(() => expect(listedIds()).toEqual(['img-2']))

    act(() => actors.dialogs.send({type: 'dialogs.clear'}))

    expect(actors.assets.getSnapshot().context.currentFolderId).toBe('f1')
    await waitFor(() =>
      expect(selectPickedAssets(actors.assets.getSnapshot()).map(({asset}) => asset._id)).toEqual([
        'img-1',
      ]),
    )
  })

  it('tells when the library has no other images, once it is fetched', async () => {
    const {actors, client, open} = await openReplaceDialog([target, pdf], {folders: [{_id: 'f1'}]})
    act(() => actors.assets.send({type: 'folder.open', folderId: 'f1'}))
    await waitFor(() => expect(actors.assets.getSnapshot().matches({fetch: 'idle'})).toBe(true))
    const refetch = deferred<Asset[]>()
    client.fetch.mockReturnValue(refetch.promise)

    open()
    expect(emptyState()).not.toBeInTheDocument()

    await act(async () => refetch.resolve([target, pdf]))
    expect(emptyState()).toBeInTheDocument()
  })

  it('loads more pages until it finds replacement candidates', async () => {
    const files = Array.from({length: 100}, (_, index) => fileAsset(`file-${index}`))
    const {client, open} = await openReplaceDialog([...files, replacement])
    client.fetch.mockClear()

    open()

    await waitFor(() => expect(listedIds()).toEqual(['img-2']))
    expect(client.fetch).toHaveBeenCalledTimes(1)
    expect(String(client.fetch.mock.lastCall?.[0])).toContain('[100...200]')
  })

  it('stops loading pages when a fetch fails', async () => {
    const files = Array.from({length: 100}, (_, index) => fileAsset(`file-${index}`))
    const {client, open} = await openReplaceDialog(files)
    client.fetch.mockClear()
    client.fetch.mockImplementation(
      createMediaFetchMock({errors: {assets: {message: 'Query timed out', statusCode: 504}}}),
    )

    open()

    expect(await screen.findByText('An error occurred: Query timed out')).toBeInTheDocument()
    expect(client.fetch).toHaveBeenCalledTimes(1)
    expect(emptyState()).not.toBeInTheDocument()
  })
})

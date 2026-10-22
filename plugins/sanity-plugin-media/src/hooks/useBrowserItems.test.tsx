import {act, screen, waitFor} from '@testing-library/react'
import {Profiler} from 'react'
import {Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {imageAsset} from '../__tests__/fixtures/documents'
import {createMediaFetchMock} from '../__tests__/fixtures/mediaFetchMock'
import {createMockSanityClient} from '../__tests__/fixtures/mockSanityClient'
import {renderWithMedia} from '../__tests__/fixtures/renderWithMedia'
import type {FolderTreeNode} from '../types'
import {combineBrowserItems, useBrowserItems} from './useBrowserItems'

function ItemList() {
  const items = useBrowserItems()
  return (
    <ol>
      {items.map((item) => (
        <li key={item.id}>{item.id}</li>
      ))}
    </ol>
  )
}

const listedIds = () => screen.queryAllByRole('listitem').map((item) => item.textContent)

const folders = [
  {_id: 'f1', name: 'Campaigns', parentId: null},
  {_id: 'f2', name: 'Summer', parentId: 'f1'},
]

function renderItemList() {
  const client = createMockSanityClient({
    fetch: createMediaFetchMock({assets: [imageAsset('a1'), imageAsset('a2')], folders}),
    // Uploads stay in progress
    observable: {assets: {upload: vi.fn(() => new Subject())}},
  })
  return renderWithMedia(<ItemList />, {client})
}

describe('combineBrowserItems', () => {
  it('lists folders, then uploads, then assets', () => {
    const folder: FolderTreeNode = {
      children: [],
      exactCount: 1,
      id: 'f1',
      name: 'Campaigns',
      parentId: null,
      path: 'Campaigns',
      totalCount: 3,
    }

    expect(combineBrowserItems([folder], ['upload'], ['asset'])).toEqual([
      {
        folderId: 'f1',
        id: 'folder:f1',
        name: 'Campaigns',
        path: 'Campaigns',
        totalCount: 3,
        type: 'folder',
      },
      {id: 'upload', type: 'upload'},
      {id: 'asset', type: 'asset'},
    ])
  })
})

describe('useBrowserItems', () => {
  it('lists the folders inside the current folder, then uploads in progress, then assets', async () => {
    const {actors} = await renderItemList()
    expect(listedIds()).toEqual(['a1', 'a2'])

    act(() => actors.assets.send({type: 'folder.open', folderId: 'f1'}))
    act(() =>
      actors.media.send({
        type: 'uploads.add',
        files: [new File(['pdf'], 'doc.pdf', {type: 'application/pdf'})],
      }),
    )

    await waitFor(() =>
      expect(listedIds()).toEqual([
        'folder:f2',
        expect.stringMatching(/^[\da-f]{40}$/),
        'a1',
        'a2',
      ]),
    )
  })

  it('does not re-render the list when assets are picked', async () => {
    const renders = vi.fn()
    const client = createMockSanityClient({
      fetch: createMediaFetchMock({assets: [imageAsset('a1'), imageAsset('a2')]}),
    })
    const {actors} = await renderWithMedia(
      <Profiler id="items" onRender={renders}>
        <ItemList />
      </Profiler>,
      {client},
    )
    renders.mockClear()

    act(() => actors.assets.send({type: 'pick.all'}))
    act(() => actors.assets.send({type: 'view.set', view: 'table'}))

    expect(renders).not.toHaveBeenCalled()
  })
})

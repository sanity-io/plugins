import {cleanup, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useState} from 'react'
import {of, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../__tests__/fixtures/mockSanityClient'
import {renderWithProviders} from '../../__tests__/fixtures/renderWithProviders'
import {createTestRootState} from '../../__tests__/fixtures/rootState'
import type {ImageAsset, Tag} from '../../types'
import {
  REPLACEMENT_PAGE_SIZE,
  type ReplacementQueryParams,
} from '../../utils/constructReplacementQuery'
import ReplaceAssetsOverview, {
  initialReplaceAssetsFilterState,
  type ReplaceAssetsFilterState,
} from './index'

const {fetchMock} = vi.hoisted(() => ({fetchMock: vi.fn()}))

vi.mock('../../hooks/useVersionedClient', () => {
  // `useClient` returns a stable client; a new one per render would refetch forever.
  const client = createMockSanityClient({observable: {fetch: fetchMock}})
  return {default: () => client}
})

vi.mock('../ReplacementAssetGrid', () => ({
  default: ({
    items,
    onLoadMore,
    onSelect,
  }: {
    items: ImageAsset[]
    onLoadMore: () => void
    onSelect: (asset: ImageAsset) => void
  }) => (
    <div data-testid="replacement-grid">
      {items.map((item) => (
        <button key={item._id} onClick={() => onSelect(item)} type="button">
          {item.originalFilename}
        </button>
      ))}
      <button onClick={onLoadMore} type="button">
        load more
      </button>
    </div>
  ),
}))

function image(id: string, originalFilename = `${id}.png`): ImageAsset {
  return {
    _id: id,
    _type: 'sanity.imageAsset',
    originalFilename,
    url: `https://cdn.example.com/${id}.png`,
    metadata: {dimensions: {height: 100, width: 100}, isOpaque: true},
  } as ImageAsset
}

const tag = {_id: 'tag-1', _type: 'media.tag', name: {_type: 'slug', current: 'campaign'}} as Tag

type FetchParams = ReplacementQueryParams

function lastFetchParams(): FetchParams {
  return fetchMock.mock.lastCall?.[1] as FetchParams
}

const noop = () => {}

function Harness({
  initialFilterState = initialReplaceAssetsFilterState,
  onSelect = noop,
}: {
  initialFilterState?: ReplaceAssetsFilterState
  onSelect?: (asset: ImageAsset) => void
}) {
  const [filterState, setFilterState] = useState(initialFilterState)
  return (
    <ReplaceAssetsOverview
      assetToReplaceId="image-original"
      filterState={filterState}
      onFilterStateChange={setFilterState}
      onSelect={onSelect}
    />
  )
}

describe('ReplaceAssetsOverview', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockImplementation(() => of([image('image-a'), image('image-b')]))
  })

  afterEach(() => {
    cleanup()
  })

  it('starts a fresh search that ignores the browser search, facets and folder', async () => {
    const preloaded = createTestRootState({
      search: {facets: [], query: 'browser query'},
    })
    preloaded.folders.currentFolderId = 'folder-browser'

    const {store} = renderWithProviders(<Harness />, {preloaded})

    expect(await screen.findByText('image-a.png')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [query] = fetchMock.mock.lastCall as [string, FetchParams]
    expect(query).not.toContain('browser query')
    expect(lastFetchParams()).toEqual({assetToReplaceId: 'image-original', end: 100, start: 0})

    // The browser's own state is left alone.
    expect(store.getState().search.query).toBe('browser query')
    expect(store.getState().folders.currentFolderId).toBe('folder-browser')
  })

  it('searches with the typed text after a short debounce', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    await screen.findByText('image-a.png')

    fetchMock.mockImplementation(() => of([image('image-c', 'match.png')]))
    await user.type(screen.getByRole('textbox', {name: 'Search images'}), 'match')

    expect(await screen.findByText('match.png')).toBeTruthy()
    expect(lastFetchParams().searchPattern).toBe('*match*')
    // Typing is debounced into a single search request.
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('filters by tag', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />, {
      preloaded: {
        tags: {
          ...createTestRootState().tags,
          allIds: ['tag-1'],
          byIds: {'tag-1': {_type: 'tag', picked: false, tag, updating: false}},
        },
      },
    })
    await screen.findByText('image-a.png')

    await user.selectOptions(screen.getByRole('combobox', {name: 'Filter by tag'}), 'tag-1')

    await waitFor(() => expect(lastFetchParams().tagId).toBe('tag-1'))
  })

  it('filters by folder, listing nested folders by path', async () => {
    const user = userEvent.setup()
    const preloaded = createTestRootState()
    preloaded.folders.byId = {
      parent: {_id: 'parent', name: 'Campaigns', parentId: null},
      child: {_id: 'child', name: '2024', parentId: 'parent'},
    }
    preloaded.folders.rootIds = ['parent']
    preloaded.folders.childrenByParentId = {parent: ['child']}

    renderWithProviders(<Harness />, {preloaded})
    await screen.findByText('image-a.png')

    const folderSelect = screen.getByRole('combobox', {name: 'Filter by folder'})
    expect(screen.getByRole('option', {name: 'Campaigns/2024'})).toBeTruthy()

    await user.selectOptions(folderSelect, 'child')

    await waitFor(() => expect(lastFetchParams().folderId).toBe('child'))
  })

  it('hides the tag and folder filters when there are none', async () => {
    renderWithProviders(<Harness />)
    await screen.findByText('image-a.png')

    expect(screen.queryByRole('combobox', {name: 'Filter by tag'})).toBeNull()
    expect(screen.queryByRole('combobox', {name: 'Filter by folder'})).toBeNull()
  })

  it('shows the no-replacements message when there are no other images', async () => {
    fetchMock.mockImplementation(() => of([]))
    renderWithProviders(<Harness />)

    expect(await screen.findByText('There are no replacement images')).toBeTruthy()
    expect(screen.queryByRole('button', {name: 'Clear search and filters'})).toBeNull()
  })

  it('offers to clear the search when nothing matches', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation((_query: string, params: FetchParams) =>
      of(params.searchPattern ? [] : [image('image-a')]),
    )
    renderWithProviders(
      <Harness initialFilterState={{...initialReplaceAssetsFilterState, searchInput: 'nothing'}} />,
    )

    expect(await screen.findByText('No images match your search')).toBeTruthy()

    await user.click(screen.getByRole('button', {name: 'Clear search and filters'}))

    expect(await screen.findByText('image-a.png')).toBeTruthy()
    expect(screen.getByRole<HTMLInputElement>('textbox', {name: 'Search images'}).value).toBe('')
  })

  it('loads the next page when more results are available', async () => {
    const user = userEvent.setup()
    const firstPage = Array.from({length: REPLACEMENT_PAGE_SIZE}, (_, index) =>
      image(`image-${index}`),
    )
    fetchMock.mockImplementation((_query: string, params: FetchParams) =>
      of(params.start === 0 ? firstPage : [image('image-last', 'last.png')]),
    )
    renderWithProviders(<Harness />)
    await screen.findByText('image-0.png')

    await user.click(screen.getByRole('button', {name: 'load more'}))

    expect(await screen.findByText('last.png')).toBeTruthy()
    expect(lastFetchParams()).toMatchObject({end: 200, start: 100})
    expect(screen.getByText('image-0.png')).toBeTruthy()
  })

  it('starts from the first page when returning to earlier filters', async () => {
    const user = userEvent.setup()
    const firstPage = Array.from({length: REPLACEMENT_PAGE_SIZE}, (_, index) =>
      image(`image-${index}`),
    )
    fetchMock.mockImplementation((_query: string, params: FetchParams) => {
      if (params.searchPattern) {
        return of([image('image-hit', 'hit.png')])
      }
      return of(params.start === 0 ? firstPage : [image('image-last', 'last.png')])
    })
    renderWithProviders(<Harness />)
    await screen.findByText('image-0.png')
    await user.click(screen.getByRole('button', {name: 'load more'}))
    await screen.findByText('last.png')

    const searchInput = screen.getByRole('textbox', {name: 'Search images'})
    await user.type(searchInput, 'hit')
    await screen.findByText('hit.png')
    await user.clear(searchInput)

    expect(await screen.findByText('image-0.png')).toBeTruthy()
    expect(lastFetchParams()).toMatchObject({end: 100, start: 0})
  })

  it('does not request another page after a short page', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    await screen.findByText('image-a.png')

    await user.click(screen.getByRole('button', {name: 'load more'}))

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shows an error with a retry button when loading fails', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementationOnce(() => throwError(() => new Error('Network down')))
    renderWithProviders(<Harness />)

    expect(await screen.findByText(/Network down/)).toBeTruthy()

    await user.click(screen.getByRole('button', {name: 'Try again'}))

    expect(await screen.findByText('image-a.png')).toBeTruthy()
  })

  it('passes the chosen image to onSelect', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderWithProviders(<Harness onSelect={onSelect} />)

    await user.click(await screen.findByText('image-b.png'))

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({_id: 'image-b'}))
  })
})

import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {render, screen, waitFor} from '@testing-library/react'
import type {ComponentProps} from 'react'
import type {Subject} from 'rxjs'
import {type AssetSourceComponentProps, ColorSchemeProvider} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {imageAsset, tag} from '../../__tests__/fixtures/documents'
import {createMediaFetchMock, type MediaFixtures} from '../../__tests__/fixtures/mediaFetchMock'
import {createMockSanityClient} from '../../__tests__/fixtures/mockSanityClient'
import {ToolOptionsProvider} from '../../contexts/ToolOptionsContext'
import useVersionedClient from '../../hooks/useVersionedClient'
import Browser from './index'

vi.mock('../../hooks/useVersionedClient', () => ({
  default: vi.fn(),
}))

const studioTheme = buildTheme()

function renderBrowser(props: ComponentProps<typeof Browser> = {}, fixtures: MediaFixtures = {}) {
  const client = createMockSanityClient({fetch: createMediaFetchMock(fixtures)})
  vi.mocked(useVersionedClient).mockReturnValue(client)
  const result = render(
    <ColorSchemeProvider scheme="light">
      <ThemeProvider theme={studioTheme}>
        <ToastProvider>
          <ToolOptionsProvider options={{creditLine: {enabled: false}}}>
            <Browser {...props} />
          </ToolOptionsProvider>
        </ToastProvider>
      </ThemeProvider>
    </ColorSchemeProvider>,
  )
  const fetchedQueries = () => client.fetch.mock.calls.map(([query]) => String(query))
  const listeners = () => client.listen.mock.results.map(({value}) => value as Subject<unknown>)
  return {...result, client, fetchedQueries, listeners}
}

const assetQuery = (query: string) => query.includes('originalFilename')

describe('Browser', () => {
  it('loads the library in the Media tool', async () => {
    const {fetchedQueries} = renderBrowser({}, {assets: [imageAsset('a1')]})

    expect(screen.getByText('Browse Assets')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Upload assets'})).toBeInTheDocument()
    await waitFor(() => expect(fetchedQueries().some(assetQuery)).toBe(true))
    expect(fetchedQueries()).toEqual([
      expect.stringContaining('"media.tag"'),
      expect.stringContaining('"media.folder"'),
      expect.stringContaining('originalFilename'),
    ])
  })

  it('only browses the asset type of the field it picks for', async () => {
    const {fetchedQueries} = renderBrowser({assetType: 'image', onSelect: vi.fn()})

    expect(screen.getByText('Insert image')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Upload images'})).toBeInTheDocument()
    await waitFor(() => expect(fetchedQueries().some(assetQuery)).toBe(true))
    expect(fetchedQueries().find(assetQuery)).toContain('_type in ["sanity.imageAsset"]')
  })

  it('pre-filters by the media tags of the field', async () => {
    const schemaType = {
      options: {mediaTags: ['product', ' product ']},
    } as unknown as AssetSourceComponentProps['schemaType']
    const {fetchedQueries} = renderBrowser({schemaType}, {tags: [tag('t1', 'product')]})

    await waitFor(() => expect(fetchedQueries().some(assetQuery)).toBe(true))
    expect(fetchedQueries().filter(assetQuery)).toEqual([
      expect.stringContaining(`references('t1')`),
    ])
  })

  it('listens to realtime changes until it is closed', async () => {
    const {listeners, unmount} = renderBrowser()
    await waitFor(() => expect(listeners()).toHaveLength(3))
    expect(listeners().every((listener) => listener.observed)).toBe(true)

    unmount()

    expect(listeners().some((listener) => listener.observed)).toBe(false)
  })
})

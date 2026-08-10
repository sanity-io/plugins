import {LayerProvider, ThemeProvider, ToastProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {of, Subject} from 'rxjs'
import {type AssetSourceComponentProps, ColorSchemeProvider} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('../Image', () => ({default: () => null}))
vi.mock('../FileAssetPreview', () => ({default: () => null}))
vi.mock('../DocumentList', () => ({default: () => null}))
vi.mock('../AssetMetadata', () => ({default: () => null}))

import {createMockSanityClient} from '../../__tests__/fixtures/mockSanityClient'
import {withinDialog} from '../../__tests__/fixtures/withinDialog'
import {ToolOptionsProvider} from '../../contexts/ToolOptionsContext'
import useVersionedClient from '../../hooks/useVersionedClient'
import type {ImageAsset} from '../../types'
import EditAssetTool from './index'

vi.mock('../../hooks/useVersionedClient', () => ({
  default: vi.fn(),
}))

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useFormValue: () => ({_id: 'doc-1', _type: 'article'}),
    useReferringDocuments: () => ({isLoading: false, referringDocuments: []}),
  }
})
const asset = {
  _id: 'a1',
  _type: 'sanity.imageAsset',
  _createdAt: '',
  _updatedAt: '',
  _rev: 'r1',
  originalFilename: 'x.png',
  size: 1,
  mimeType: 'image/png',
  url: 'https://example.com/x.png',
  metadata: {dimensions: {width: 100, height: 100}, isOpaque: true},
} as ImageAsset

function renderTool(overrides: Record<string, unknown> = {}) {
  const props = {
    assetType: 'image',
    onClose: vi.fn(),
    onSelect: vi.fn(),
    selectedAssets: [asset],
    ...overrides,
  }

  render(
    <ColorSchemeProvider scheme="light">
      <ThemeProvider theme={buildTheme()}>
        <ToastProvider>
          <LayerProvider>
            <ToolOptionsProvider options={{creditLine: {enabled: false}}}>
              <EditAssetTool {...(props as unknown as AssetSourceComponentProps)} />
            </ToolOptionsProvider>
          </LayerProvider>
        </ToastProvider>
      </ThemeProvider>
    </ColorSchemeProvider>,
  )

  return props
}

let fetch: ReturnType<typeof vi.fn>

describe('EditAssetTool', () => {
  beforeEach(() => {
    // Return a shape appropriate to each query (folders vs assets/tags) so the
    // corresponding epics don't choke while reducing store state.
    fetch = vi.fn((query: string) => {
      if (query.includes('media.folder')) {
        return of({folders: [], unfiledCount: 0})
      }
      return of({items: [asset]})
    })
    vi.mocked(useVersionedClient).mockReturnValue(
      createMockSanityClient({listen: vi.fn(() => new Subject()), observable: {fetch}}),
    )
  })

  afterEach(() => {
    cleanup()
  })

  it('opens the asset edit dialog for the selected asset', async () => {
    renderTool()

    await waitFor(() => {
      expect(withinDialog(/asset details/i, screen).getByText('Asset details')).toBeInTheDocument()
    })
  })

  it('fetches tags and folders so saving does not wipe existing tags/folder', async () => {
    renderTool()

    await waitFor(() => {
      expect(withinDialog(/asset details/i, screen).getByText('Asset details')).toBeInTheDocument()
    })

    const queries = fetch.mock.calls.map((call) => String(call[0]))
    expect(queries.some((q) => q.includes('media.tag'))).toBe(true)
    expect(queries.some((q) => q.includes('media.folder'))).toBe(true)
  })

  it('closes the source immediately when no asset is selected', async () => {
    const {onClose} = renderTool({selectedAssets: []})

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(screen.queryByText('Asset details')).not.toBeInTheDocument()
  })

  it('closes the source after the edit dialog is dismissed', async () => {
    const user = userEvent.setup()
    const {onClose} = renderTool()

    await waitFor(() => {
      expect(withinDialog(/asset details/i, screen).getByText('Asset details')).toBeInTheDocument()
    })

    await user.click(
      withinDialog(/asset details/i, screen).getByRole('button', {name: /close dialog/i}),
    )

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})

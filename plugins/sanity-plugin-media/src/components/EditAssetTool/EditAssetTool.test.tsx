import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
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
    useDocumentStore: () => ({}),
    WithReferringDocuments: ({children}: {children: (args: unknown) => unknown}) =>
      children({isLoading: false, referringDocuments: []}),
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
      <ThemeProvider theme={studioTheme}>
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

describe('EditAssetTool', () => {
  beforeEach(() => {
    const fetch = vi.fn().mockReturnValue(of({items: [asset]}))
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

import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type AssetSourceComponentProps, ColorSchemeProvider} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {imageAsset, tag, tagReference} from '../../__tests__/fixtures/documents'
import {createMediaFetchMock} from '../../__tests__/fixtures/mediaFetchMock'
import {createMockSanityClient} from '../../__tests__/fixtures/mockSanityClient'
import {withinDialog} from '../../__tests__/fixtures/withinDialog'
import {ToolOptionsProvider} from '../../contexts/ToolOptionsContext'
import useVersionedClient from '../../hooks/useVersionedClient'
import type {Asset} from '../../types'
import EditAssetTool from './index'

vi.mock('../Image', () => ({default: () => null}))
vi.mock('../FileAssetPreview', () => ({default: () => null}))
vi.mock('../DocumentList', () => ({default: () => null}))
vi.mock('../AssetMetadata', () => ({default: () => null}))

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

const product = tag('t1', 'product')
const asset = imageAsset('a1', {opt: {media: {tags: [tagReference('t1')]}}})
const studioTheme = buildTheme()

function renderTool(selectedAssets: Asset[] = [asset]) {
  const client = createMockSanityClient({
    fetch: createMediaFetchMock({assets: [asset, imageAsset('a2')], tags: [product]}),
  })
  vi.mocked(useVersionedClient).mockReturnValue(client)
  const onClose = vi.fn()
  const props = {
    assetType: 'image',
    onClose,
    onSelect: vi.fn(),
    selectedAssets,
  } as unknown as AssetSourceComponentProps

  render(
    <ColorSchemeProvider scheme="light">
      <ThemeProvider theme={studioTheme}>
        <ToastProvider>
          <LayerProvider>
            <ToolOptionsProvider options={{creditLine: {enabled: false}}}>
              <EditAssetTool {...props} />
            </ToolOptionsProvider>
          </LayerProvider>
        </ToastProvider>
      </ThemeProvider>
    </ColorSchemeProvider>,
  )

  return {client, onClose}
}

const editDialog = () => withinDialog(/asset details/i, screen)

/** Resolves once the edit dialog shows the tags of the asset, which load after it opens. */
const waitForEditDialog = async () => {
  await screen.findByRole('dialog', {name: /asset details/i})
  await editDialog().findByText('product')
}

describe('EditAssetTool', () => {
  it('opens the edit dialog of the selected asset, with its tags', async () => {
    const {client} = renderTool()

    await waitForEditDialog()

    expect(client.fetch).toHaveBeenCalledWith(
      expect.stringContaining('_id == $assetId'),
      expect.objectContaining({assetId: 'a1'}),
      expect.anything(),
    )
    expect(client.fetch).toHaveBeenCalledWith(
      expect.stringContaining('"media.folder"'),
      expect.anything(),
      expect.anything(),
    )
    expect(client.listen).not.toHaveBeenCalled()
  })

  it('closes right away when no asset is selected', () => {
    const {client, onClose} = renderTool([])

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(client.fetch).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes once the edit dialog is dismissed', async () => {
    const user = userEvent.setup()
    const {onClose} = renderTool()
    await waitForEditDialog()

    await user.click(editDialog().getByRole('button', {name: /close dialog/i}))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('stays open while confirming the deletion, and closes once the asset is deleted', async () => {
    const user = userEvent.setup()
    const {client, onClose} = renderTool()
    await waitForEditDialog()

    await user.click(editDialog().getByRole('button', {name: /^delete$/i}))
    expect(onClose).not.toHaveBeenCalled()
    await user.click(
      withinDialog(/confirm deletion/i, screen).getByRole('button', {name: 'Yes, delete 1 asset'}),
    )

    expect(onClose).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(client.delete).toHaveBeenCalledWith({
        params: {assetIds: ['a1']},
        query: '*[_id in $assetIds]',
      }),
    )
  })
})

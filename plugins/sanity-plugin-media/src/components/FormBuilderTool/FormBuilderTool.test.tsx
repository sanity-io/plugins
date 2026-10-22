import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {render, screen, waitFor} from '@testing-library/react'
import {type AssetSourceComponentProps, ColorSchemeProvider} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {createMediaFetchMock} from '../../__tests__/fixtures/mediaFetchMock'
import {createMockSanityClient} from '../../__tests__/fixtures/mockSanityClient'
import {ToolOptionsProvider} from '../../contexts/ToolOptionsContext'
import useVersionedClient from '../../hooks/useVersionedClient'
import FormBuilderTool from './index'

vi.mock('../../hooks/useVersionedClient', () => ({
  default: vi.fn(),
}))

vi.mock('sanity', async (importOriginal) => {
  const mod = await importOriginal<typeof import('sanity')>()
  return {
    ...mod,
    useFormValue: () => ({_id: 'doc-1', _type: 'article'}),
  }
})

const studioTheme = buildTheme()

function renderTool(assetType: 'file' | 'image') {
  const client = createMockSanityClient({fetch: createMediaFetchMock()})
  vi.mocked(useVersionedClient).mockReturnValue(client)
  const props = {
    assetType,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    schemaType: {},
    selectedAssets: [],
  } as unknown as AssetSourceComponentProps
  render(
    <ColorSchemeProvider scheme="light">
      <ThemeProvider theme={studioTheme}>
        <ToastProvider>
          <LayerProvider>
            <ToolOptionsProvider options={{creditLine: {enabled: false}}}>
              <FormBuilderTool {...props} />
            </ToolOptionsProvider>
          </LayerProvider>
        </ToastProvider>
      </ThemeProvider>
    </ColorSchemeProvider>,
  )
  return {client}
}

describe('FormBuilderTool', () => {
  it.each(['image', 'file'] as const)(
    'browses %s assets to insert into the field',
    async (assetType) => {
      const {client} = renderTool(assetType)

      expect(await screen.findByText(`Insert ${assetType}`)).toBeInTheDocument()
      await waitFor(() =>
        expect(client.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`_type in ["sanity.${assetType}Asset"]`),
          expect.anything(),
          expect.anything(),
        ),
      )
    },
  )
})

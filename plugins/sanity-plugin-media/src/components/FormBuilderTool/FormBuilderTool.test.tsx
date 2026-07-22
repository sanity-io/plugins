import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {render, screen, waitFor} from '@testing-library/react'
import {of} from 'rxjs'
import {ColorSchemeProvider} from 'sanity'
import {describe, expect, it, vi, beforeEach} from 'vitest'

import {createListenMock} from '../../__tests__/fixtures/listenMock'
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

describe('FormBuilderTool', () => {
  beforeEach(() => {
    const fetch = vi.fn().mockReturnValue(of({items: []}))
    vi.mocked(useVersionedClient).mockReturnValue(
      createMockSanityClient({
        listen: createListenMock(),
        observable: {fetch},
      }),
    )
  })

  // First form mount is expensive under styled-components v6.4; keep headroom on slow CI runners
  it('renders picker header for image asset type', {timeout: 30_000}, async () => {
    render(
      <ColorSchemeProvider scheme="light">
        <ThemeProvider theme={studioTheme}>
          <ToastProvider>
            <LayerProvider>
              <ToolOptionsProvider options={{creditLine: {enabled: false}}}>
                <FormBuilderTool
                  {...({
                    assetType: 'image',
                    onClose: vi.fn(),
                    onSelect: vi.fn(),
                    schemaType: {},
                    selectedAssets: undefined,
                  } as any)}
                />
              </ToolOptionsProvider>
            </LayerProvider>
          </ToastProvider>
        </ThemeProvider>
      </ColorSchemeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Insert image/i)).toBeInTheDocument()
    })
  })
})

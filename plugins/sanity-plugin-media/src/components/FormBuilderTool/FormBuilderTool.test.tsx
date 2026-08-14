import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, cleanup, render, screen, waitFor} from '@testing-library/react'
import {of} from 'rxjs'
import {ColorSchemeProvider} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

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
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    const fetch = vi.fn().mockReturnValue(of({items: []}))
    vi.mocked(useVersionedClient).mockReturnValue(
      createMockSanityClient({
        listen: createListenMock(),
        observable: {fetch},
      }),
    )
  })

  it('renders picker header for image asset type', async () => {
    const {unmount} = render(
      <ColorSchemeProvider scheme="light">
        <ThemeProvider theme={buildTheme()}>
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

    // Same teardown hygiene as Browser.test.tsx — flush Activity/Popover work
    // after unmount so jsdom teardown cannot race React updates.
    unmount()
    await act(async () => {
      await Promise.resolve()
    })
  })
})

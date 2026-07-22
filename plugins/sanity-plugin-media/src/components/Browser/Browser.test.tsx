import {studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {render, screen, waitFor} from '@testing-library/react'
import {of} from 'rxjs'
import {ColorSchemeProvider} from 'sanity'
import {describe, expect, it, vi, beforeEach} from 'vitest'

import {createListenMock} from '../../__tests__/fixtures/listenMock'
import {createMockSanityClient} from '../../__tests__/fixtures/mockSanityClient'
import {ToolOptionsProvider} from '../../contexts/ToolOptionsContext'
import useVersionedClient from '../../hooks/useVersionedClient'
import Browser from './index'

vi.mock('../../hooks/useVersionedClient', () => ({
  default: vi.fn(),
}))

describe('Browser', () => {
  beforeEach(() => {
    const fetch = vi.fn().mockReturnValue(of({items: []}))
    vi.mocked(useVersionedClient).mockReturnValue(
      createMockSanityClient({
        listen: createListenMock(),
        observable: {fetch},
      }),
    )
  })

  // First tool mount is expensive under styled-components v6.4; keep headroom on slow CI runners
  it('renders Browse Assets header in tool mode', {timeout: 30_000}, async () => {
    render(
      <ColorSchemeProvider scheme="light">
        <ThemeProvider theme={studioTheme}>
          <ToastProvider>
            <ToolOptionsProvider options={{creditLine: {enabled: false}}}>
              <Browser />
            </ToolOptionsProvider>
          </ToastProvider>
        </ThemeProvider>
      </ColorSchemeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Browse Assets')).toBeInTheDocument()
    })
  })
})

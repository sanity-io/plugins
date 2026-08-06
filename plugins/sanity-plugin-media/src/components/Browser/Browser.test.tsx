import {studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {cleanup, render, screen, waitFor} from '@testing-library/react'
import {of, Subject} from 'rxjs'
import {ColorSchemeProvider} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../__tests__/fixtures/mockSanityClient'
import {ToolOptionsProvider} from '../../contexts/ToolOptionsContext'
import useVersionedClient from '../../hooks/useVersionedClient'
import Browser from './index'

vi.mock('../../hooks/useVersionedClient', () => ({
  default: vi.fn(),
}))

describe('Browser', () => {
  beforeEach(() => {
    // Shape responses per query so fetch epics settle without cascading errors.
    const fetch = vi.fn((query: string) => {
      if (query.includes('media.folder')) {
        return of({folders: [], unfiledCount: 0})
      }
      return of({items: []})
    })
    vi.mocked(useVersionedClient).mockReturnValue(
      createMockSanityClient({
        listen: vi.fn(() => new Subject()),
        observable: {fetch},
      }),
    )
  })

  afterEach(() => {
    cleanup()
  })

  it('renders Browse Assets header in tool mode', async () => {
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

  it('shows Tags panel by default', async () => {
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
      expect(screen.getAllByText('Tags').length).toBeGreaterThan(0)
    })
  })
})

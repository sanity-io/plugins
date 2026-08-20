import {ThemeProvider} from '@sanity/ui'
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
import Browser from './index'

vi.mock('../../hooks/useVersionedClient', () => ({
  default: vi.fn(),
}))

const studioTheme = buildTheme()

describe('Browser', () => {
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

  it('renders Browse Assets header in tool mode', async () => {
    const {unmount} = render(
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

    // @sanity/ui v4 keeps Popover/Tooltip content mounted via Activity and may
    // schedule follow-up work; unmount and flush so that work does not race
    // jsdom teardown (which otherwise surfaces as unhandled errors in CI).
    unmount()
    await act(async () => {
      await Promise.resolve()
    })
  })
})

import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {Activity} from 'react'
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

const studioTheme = buildTheme()

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

  it('shows Tags panel by default', async () => {
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
      expect(screen.getAllByText('Tags').length).toBeGreaterThan(0)
    })

    unmount()
    await act(async () => {
      await Promise.resolve()
    })
  })

  it('does not fetch or listen again when an Activity boundary shows it again', async () => {
    // The mocked hook returns the client created in `beforeEach`
    const client = useVersionedClient()
    const tree = (mode: 'visible' | 'hidden') => (
      <ColorSchemeProvider scheme="light">
        <ThemeProvider theme={studioTheme}>
          <ToastProvider>
            <ToolOptionsProvider options={{creditLine: {enabled: false}}}>
              <Activity mode={mode}>
                <Browser />
              </Activity>
            </ToolOptionsProvider>
          </ToastProvider>
        </ThemeProvider>
      </ColorSchemeProvider>
    )
    const {rerender, unmount} = render(tree('visible'))

    await waitFor(() => {
      expect(screen.getByText('Browse Assets')).toBeInTheDocument()
    })
    // The asset search is debounced, so give the initial fetches time to be issued
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 500)
      })
    })
    const fetchCalls = vi.mocked(client.observable.fetch).mock.calls.length
    expect(fetchCalls).toBeGreaterThan(0)
    expect(client.listen).toHaveBeenCalledTimes(3)

    rerender(tree('hidden'))
    await act(async () => {
      await Promise.resolve()
    })
    rerender(tree('visible'))
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 500)
      })
    })

    expect(client.observable.fetch).toHaveBeenCalledTimes(fetchCalls)
    expect(client.listen).toHaveBeenCalledTimes(3)

    unmount()
    await act(async () => {
      await Promise.resolve()
    })
  })

  it('keeps an open dialog portaled into the browser while an Activity boundary hides it', async () => {
    const tree = (mode: 'visible' | 'hidden') => (
      <ColorSchemeProvider scheme="light">
        <ThemeProvider theme={studioTheme}>
          <ToastProvider>
            <ToolOptionsProvider options={{creditLine: {enabled: false}}}>
              <Activity mode={mode}>
                <Browser />
              </Activity>
            </ToolOptionsProvider>
          </ToastProvider>
        </ThemeProvider>
      </ColorSchemeProvider>
    )
    const {rerender, unmount} = render(tree('visible'))

    // jsdom's viewport is below the breakpoint that shows the tags panel inline, so the
    // "Tags" control opens the tags dialog instead.
    fireEvent.click(await screen.findByRole('button', {name: 'Tags'}))
    const dialog = await screen.findByRole('dialog')
    const browser = screen.getByTestId('media-browser')
    expect(browser).toContainElement(dialog)

    rerender(tree('hidden'))
    await act(async () => {
      await Promise.resolve()
    })
    rerender(tree('visible'))

    expect(screen.getByRole('dialog')).toBe(dialog)
    expect(browser).toContainElement(dialog)

    unmount()
    await act(async () => {
      await Promise.resolve()
    })
  })
})

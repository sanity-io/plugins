import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react'
import type {SanityDocument} from 'sanity'
import {afterEach, beforeAll, describe, expect, test, vi} from 'vitest'

import {Iframe, type IframeOptions} from './Iframe'

const sanityMocks = vi.hoisted(() => ({
  activeWorkspace: {activeWorkspace: {basePath: '/'}},
  client: {},
  currentUser: {id: 'user-id'},
  perspective: {perspectiveStack: ['drafts'], selectedPerspectiveName: undefined},
}))

vi.mock('sanity', () => ({
  useActiveWorkspace: () => sanityMocks.activeWorkspace,
  useClient: () => sanityMocks.client,
  useCurrentUser: () => sanityMocks.currentUser,
  usePerspective: () => sanityMocks.perspective,
}))

const theme = buildTheme()

let prefersReducedMotion = false

beforeAll(() => {
  // jsdom has no matchMedia; @sanity/ui queries it for color scheme and reduced motion.
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      addEventListener: () => {},
      matches: prefersReducedMotion && query.includes('prefers-reduced-motion: reduce'),
      media: query,
      removeEventListener: () => {},
    }),
  })
})

afterEach(() => {
  cleanup()
  prefersReducedMotion = false
})

function createDocument(title: string): SanityDocument {
  return {
    _id: 'drafts.movie',
    _type: 'movie',
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    _rev: title,
    title,
  }
}

function renderIframe(draft: SanityDocument, options: IframeOptions) {
  const ui = (doc: SanityDocument) => (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <Iframe document={{displayed: doc, draft: doc, published: null}} options={options} />
      </ToastProvider>
    </ThemeProvider>
  )
  const result = render(ui(draft))
  return {...result, rerender: (doc: SanityDocument) => result.rerender(ui(doc))}
}

function readOpacity(element: HTMLElement): number {
  const {opacity} = element.style
  return opacity === '' ? 1 : Number(opacity)
}

async function waitUntilVisible(iframe: HTMLElement) {
  await vi.waitFor(() => expect(readOpacity(iframe)).toBe(1), {timeout: 3_000, interval: 20})
}

/**
 * Samples the iframe's opacity long enough to cover a replay of the 0.8s fade-in.
 */
async function lowestOpacityOver(iframe: HTMLElement, durationMs = 1_000): Promise<number> {
  let lowest = readOpacity(iframe)
  const start = performance.now()
  while (performance.now() - start < durationMs) {
    // oxlint-disable-next-line no-await-in-loop
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
    lowest = Math.min(lowest, readOpacity(iframe))
  }
  return lowest
}

describe('Iframe', () => {
  test(
    'a loaded preview stays visible while the document is edited',
    {timeout: 10_000},
    async () => {
      const resolveUrl = vi.fn(
        async (doc: SanityDocument | null) => `https://example.com/preview/${doc?._id}`,
      )
      const {rerender} = renderIframe(createDocument('Before'), {url: resolveUrl})

      const iframe = await screen.findByTitle('preview')
      fireEvent.load(iframe)
      await waitUntilVisible(iframe)

      rerender(createDocument('After'))
      const lowest = await lowestOpacityOver(iframe)

      expect(resolveUrl).toHaveBeenCalledTimes(2)
      expect(iframe.getAttribute('src')).toBe('https://example.com/preview/drafts.movie')
      expect(lowest).toBe(1)
    },
  )

  test('reloading a loaded preview does not fade it out', {timeout: 10_000}, async () => {
    renderIframe(createDocument('Before'), {
      url: 'https://example.com/preview',
      reload: {button: true},
    })

    const iframe = await screen.findByTitle('preview')
    fireEvent.load(iframe)
    await waitUntilVisible(iframe)

    fireEvent.click(screen.getByRole('button', {name: 'Reload'}))
    const lowest = await lowestOpacityOver(iframe)

    expect(lowest).toBe(1)
  })

  test('shows the preview without fading in when reduced motion is preferred', async () => {
    prefersReducedMotion = true
    renderIframe(createDocument('Before'), {url: 'https://example.com/preview'})

    const iframe = await screen.findByTitle('preview')
    fireEvent.load(iframe)

    await vi.waitFor(() => expect(readOpacity(iframe)).toBe(1), {timeout: 200, interval: 10})
  })
})

// @vitest-environment jsdom
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react'
import {Activity} from 'react'
import type {SanityDocument} from 'sanity'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {Iframe, type IframeOptions} from './Iframe'

vi.mock('sanity', () => ({
  useActiveWorkspace: () => ({activeWorkspace: {basePath: '/'}}),
  useClient: () => ({}),
  useCurrentUser: () => null,
  usePerspective: () => ({perspectiveStack: [], selectedPerspectiveName: undefined}),
}))

// jsdom has no matchMedia; @sanity/ui reads the reduced-motion preference through it
let prefersReducedMotion = false
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: () => ({
    get matches() {
      return prefersReducedMotion
    },
    addEventListener() {},
    removeEventListener() {},
  }),
})

const theme = buildTheme()
const doc = {_id: 'doc', _type: 'page', _rev: 'r', _createdAt: '', _updatedAt: ''} as SanityDocument
const iframeDocument = {displayed: doc, draft: null, published: doc}

const tree = (mode: 'visible' | 'hidden', options: Partial<IframeOptions> = {}) => (
  <ThemeProvider theme={theme}>
    <ToastProvider>
      <Activity mode={mode}>
        <Iframe document={iframeDocument} options={{url: 'https://example.com', ...options}} />
      </Activity>
    </ToastProvider>
  </ThemeProvider>
)

const wait = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  })

describe('Iframe', () => {
  afterEach(() => {
    cleanup()
    prefersReducedMotion = false
  })

  test('keeps a loaded preview visible when an Activity boundary shows it again', async () => {
    const {rerender} = render(tree('visible'))

    const iframe = await screen.findByTitle('preview')
    fireEvent.load(iframe)
    await vi.waitFor(
      () => {
        expect(iframe.style.opacity).toBe('1')
      },
      {timeout: 3000},
    )

    rerender(tree('hidden'))
    rerender(tree('visible'))
    // Motion applies its remount values on the next frame
    await wait(50)

    expect(iframe.style.opacity).toBe('1')
  })

  test('keeps the reload pulse on its default timing', async () => {
    render(tree('visible', {reload: {button: true}}))

    const iframe = await screen.findByTitle('preview')
    fireEvent.load(iframe)
    await vi.waitFor(
      () => {
        expect(iframe.style.opacity).toBe('1')
      },
      {timeout: 3000},
    )

    fireEvent.click(screen.getByRole('button', {name: 'Reload'}))
    // `reloading` scales the iframe with `[1, 1, 1, 0.98]` keyframes, which Motion spreads over
    // its 0.8s keyframe default: scale stays 1 for the first two thirds. A transition that strips
    // that default from `scale` (an opacity-only `transition` prop does) runs the pulse in 0.3s.
    await wait(350)
    expect(iframe.style.transform).not.toContain('0.98')
    await vi.waitFor(
      () => {
        expect(iframe.style.transform).toContain('0.98')
      },
      {timeout: 3000},
    )
  })

  test('shows a loaded preview right away when reduced motion is preferred', async () => {
    prefersReducedMotion = true
    render(tree('visible'))

    const iframe = await screen.findByTitle('preview')
    fireEvent.load(iframe)
    // Well within the 0.4s the fade would otherwise wait before starting
    await wait(100)
    expect(iframe.style.opacity).toBe('1')

    // The size change is instant as well, not only the opacity
    const mobileButton = document
      .querySelector('[data-sanity-icon="mobile-device"]')
      ?.closest('button')
    fireEvent.click(mobileButton!)
    await wait(100)
    expect(iframe.style.width).toBe('414px')
  })
})

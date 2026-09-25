// oxlint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/vitest'
import {cleanup, configure} from '@testing-library/react'
import {afterEach, vi} from 'vitest'

// Testing Library only cleans up on its own with Vitest globals. Unmounting also stops the media
// actors of rendered components, so their listeners and timers don't leak into later tests.
afterEach(cleanup)

// Toasts render in a transition, which can take longer than a second while every test file runs
configure({asyncUtilTimeout: 3000})

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// jsdom has no ResizeObserver, and @sanity/ui v4 uses the global API directly
// instead of shipping the @juggle/resize-observer polyfill.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

/// <reference types="@testing-library/jest-dom/vitest" />

import * as matchers from '@testing-library/jest-dom/matchers'
import {expect, vi} from 'vitest'

// Not `@testing-library/jest-dom/vitest`: that entry extends whichever vitest
// pnpm links next to jest-dom, which can be a different copy than the one
// running the tests.
expect.extend(matchers)

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

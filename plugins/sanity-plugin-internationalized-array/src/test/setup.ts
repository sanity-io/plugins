/// <reference types="@testing-library/jest-dom/vitest" />

import * as matchers from '@testing-library/jest-dom/matchers'
import {expect} from 'vitest'

// Not `@testing-library/jest-dom/vitest`: that entry extends whichever vitest
// pnpm links next to jest-dom, which can be a different copy than the one
// running the tests.
expect.extend(matchers)

// Mock window.matchMedia for @sanity/ui components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

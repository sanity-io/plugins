/// <reference types="vitest/jsdom" />
import * as _jestDom from '@testing-library/jest-dom/vitest'

// Node >= 25 defines its own `localStorage` and `sessionStorage` globals, which are undefined
// unless Node runs with `--localstorage-file`. Vitest 4's jsdom environment doesn't replace
// globals Node already defines, so point them at jsdom's storage. Vitest 5 does this itself.
for (const key of ['localStorage', 'sessionStorage'] as const) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    get: () => jsdom.window[key],
  })
}

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

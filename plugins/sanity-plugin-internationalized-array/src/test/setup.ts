import * as _jestDom from '@testing-library/jest-dom/vitest'

// Prevent unused variable warning - side-effect import that extends vitest expect
void _jestDom

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

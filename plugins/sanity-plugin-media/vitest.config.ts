import {defineConfig} from 'vitest/config'

export default defineConfig({
  oxc: {
    jsx: {runtime: 'automatic'},
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    passWithNoTests: false,
    css: true,
  },
})

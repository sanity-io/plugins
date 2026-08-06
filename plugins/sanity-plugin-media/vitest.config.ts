import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  oxc: {
    jsx: {runtime: 'automatic'},
  },
  plugins: [vanillaExtractPlugin()],
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts', '@vanilla-extract/css/disableRuntimeStyles'],
    passWithNoTests: false,
    css: true,
  },
})

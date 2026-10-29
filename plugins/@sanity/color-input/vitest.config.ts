import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [vanillaExtractPlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: ['@vanilla-extract/css/disableRuntimeStyles', './src/test/setup.ts'],
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})

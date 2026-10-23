import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [vanillaExtractPlugin()],
  test: {
    setupFiles: ['@vanilla-extract/css/disableRuntimeStyles'],
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})

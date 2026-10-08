import {reactCompilerPluginForVitest} from '@sanity/plugin-kit/vitest'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  // Match `reactCompiler: {transform: 'oxc'}` in tsdown.config.ts so tests exercise compiled output.
  plugins: [reactCompilerPluginForVitest(), vanillaExtractPlugin()],
  test: {
    setupFiles: ['@vanilla-extract/css/disableRuntimeStyles'],
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})

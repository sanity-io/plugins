import {reactCompilerPluginForVitest} from '@sanity/plugin-kit/vitest'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  // Match `reactCompiler: {transform: 'oxc'}` in tsdown.config.ts so tests exercise compiled output.
  plugins: [reactCompilerPluginForVitest()],
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})

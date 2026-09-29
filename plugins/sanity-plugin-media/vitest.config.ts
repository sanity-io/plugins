import {reactCompilerPluginForVitest} from '@sanity/plugin-kit/vitest'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  // Match `reactCompiler: {transform: 'oxc'}` in tsdown.config.ts so tests exercise compiled output.
  plugins: [reactCompilerPluginForVitest()],
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    passWithNoTests: false,
    css: true,
  },
})

import pluginBabel from '@rolldown/plugin-babel'
import {reactCompilerPreset} from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  // Run tests against React Compiler output so they exercise the same memoized
  // code as the published build (`reactCompiler: true` in tsdown.config.ts uses
  // the same plugin + preset combination).
  plugins: [pluginBabel({presets: [reactCompilerPreset()]})],
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

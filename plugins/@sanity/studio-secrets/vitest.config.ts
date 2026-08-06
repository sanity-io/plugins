import pluginBabel from '@rolldown/plugin-babel'
import {reactCompilerPreset} from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  // Match `reactCompiler: true` in tsdown.config.ts so tests exercise compiled output.
  plugins: [pluginBabel({presets: [reactCompilerPreset()]})],
  oxc: {
    jsx: {runtime: 'automatic'},
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})

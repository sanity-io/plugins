import pluginBabel from '@rolldown/plugin-babel'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {reactCompilerPreset} from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

// Match `reactCompiler: true` in tsdown.config.ts so tests exercise compiled output.
// Vitest transforms node-environment tests through the `ssr` Vite environment, where the
// preset's client-only default would silently drop the compiler — apply it everywhere.
const compilerPreset = reactCompilerPreset()
compilerPreset.rolldown.applyToEnvironmentHook = () => true

export default defineConfig({
  plugins: [pluginBabel({presets: [compilerPreset]}), vanillaExtractPlugin()],
  oxc: {
    jsx: {runtime: 'automatic'},
  },
  test: {
    setupFiles: ['@vanilla-extract/css/disableRuntimeStyles'],
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})

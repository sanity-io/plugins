import pluginBabel from '@rolldown/plugin-babel'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {reactCompilerPreset} from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

// Vitest transforms modules through the SSR environment ('server' consumer), which
// reactCompilerPreset()'s default applyToEnvironmentHook excludes. Apply it
// unconditionally so tests exercise compiled output, like published tsdown builds.
const reactCompiler = reactCompilerPreset()
reactCompiler.rolldown.applyToEnvironmentHook = () => true

export default defineConfig({
  // Match `reactCompiler: true` in tsdown.config.ts so tests exercise compiled output.
  plugins: [pluginBabel({presets: [reactCompiler]}), vanillaExtractPlugin()],
  test: {
    setupFiles: ['@vanilla-extract/css/disableRuntimeStyles'],
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})

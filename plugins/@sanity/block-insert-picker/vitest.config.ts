import pluginBabel from '@rolldown/plugin-babel'
import {reactCompilerPreset} from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

// Vitest transforms modules through the SSR environment ('server' consumer), which
// reactCompilerPreset()'s default applyToEnvironmentHook excludes. Apply it
// unconditionally so tests exercise compiled output, like published tsdown builds.
const reactCompiler = reactCompilerPreset()
reactCompiler.rolldown.applyToEnvironmentHook = () => true

export default defineConfig({
  // Match `reactCompiler: true` in tsdown.config.ts so tests exercise compiled output.
  plugins: [pluginBabel({presets: [reactCompiler]})],
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})

import pluginBabel from '@rolldown/plugin-babel'
import {reactCompilerPreset} from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

/** Apply React Compiler in Vitest SSR (`consumer: 'server'`), not only Vite client. */
function reactCompilerPresetForVitest() {
  const preset = reactCompilerPreset()
  return {
    ...preset,
    rolldown: {
      ...preset.rolldown,
      applyToEnvironmentHook: () => true,
    },
  }
}

export default defineConfig({
  // Match `reactCompiler: true` in tsdown.config.ts so tests exercise compiled output.
  plugins: [pluginBabel({presets: [reactCompilerPresetForVitest()]})],
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    passWithNoTests: false,
    css: true,
  },
})

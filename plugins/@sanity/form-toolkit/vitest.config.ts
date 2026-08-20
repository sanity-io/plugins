import pluginBabel from '@rolldown/plugin-babel'
import {reactCompilerPreset} from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  // Match `reactCompiler: true` in tsdown.config.ts so tests exercise compiled output.
  plugins: [pluginBabel({presets: [reactCompilerPreset()]})],
  test: {
    // Component tests opt into jsdom per-file via `// @vitest-environment jsdom`.
    // The default stays `node` so the package-exports test keeps resolving `sanity`
    // the same way it does in the published environment.
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})

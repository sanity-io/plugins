import {reactCompilerPluginForVitest} from '@sanity/plugin-kit/vitest'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  // Match `reactCompiler: {transform: 'oxc'}` in tsdown.config.ts so tests exercise compiled output.
  plugins: [reactCompilerPluginForVitest()],
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

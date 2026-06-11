import {defineCliConfig} from 'sanity/cli'
import {mergeConfig, type InlineConfig} from 'vite'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'
const appId = process.env.SANITY_STUDIO_APP_ID || 'bi1ktslqwmu1cawds5ce3jn6'
const tsRE = /\.tsx?$/
// Enables Vite DevTools (https://devtools.vite.dev) for both `sanity dev` and `sanity build`.
// During `sanity build` it records a Rolldown build session, which can then be inspected from
// the DevTools dock in a running `sanity dev` server without restarting it.
// Usage: `pnpm devtools:test-studio` from the repo root (see AGENTS.md).
const isViteDevToolsEnabled = process.env.ENABLE_VITE_DEVTOOLS === 'true'

export default defineCliConfig({
  api: {projectId, dataset},
  deployment: {appId, autoUpdates: true},
  reactStrictMode: true,
  reactCompiler: {
    target: '19',
    sources: (filename) => {
      // The default behavior is to always skip node_modules: https://github.com/facebook/react/blob/d6cae440e34c6250928e18bed4a16480f83ae18a/compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts#L326
      if (filename.indexOf('node_modules') !== -1) {
        return false
      }
      // If the file is `.ts` or `.tsx` then we should run the compiler (it's resolved with the `development` condition during `sanity dev`)
      // otherwise it's likely resolving a built file that had react compiler already applied during its build process
      return tsRE.test(filename)
    },
  },
  studioHost: 'plugins',
  typegen: {formatGeneratedCode: false},
  async vite(viteConfig: InlineConfig): Promise<InlineConfig> {
    if (!isViteDevToolsEnabled) {
      return viteConfig
    }
    // Lazy import so the devtools package is only loaded when the flag is enabled
    const {DevTools} = await import('@vitejs/devtools')
    return mergeConfig(viteConfig, {
      plugins: [DevTools()],
      // `devtools: {}` makes `sanity build` emit a Rolldown build session that the DevTools dock can inspect
      build: {rolldownOptions: {devtools: {}}},
    } satisfies InlineConfig)
  },
})

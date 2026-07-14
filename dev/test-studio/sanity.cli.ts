import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin'
import {DevTools} from '@vitejs/devtools'
import {defineCliConfig} from 'sanity/cli'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'
const appId = process.env.SANITY_STUDIO_APP_ID || 'bi1ktslqwmu1cawds5ce3jn6'
// Enables Vite DevTools (https://devtools.vite.dev) for both `sanity dev` and `sanity build`.
// During `sanity build` it records a Rolldown build session, which can then be inspected from
// the DevTools dock in a running `sanity dev` server without restarting it.
// Usage: `pnpm devtools:test-studio` from the repo root (see AGENTS.md).
const isViteDevToolsEnabled = process.env.ENABLE_VITE_DEVTOOLS === 'true'

export default defineCliConfig({
  api: {projectId, dataset},
  deployment: {appId, autoUpdates: true},
  reactCompiler: {},
  typegen: {formatGeneratedCode: false},
  vite: {
    plugins: [vanillaExtractPlugin(), ...(isViteDevToolsEnabled ? [DevTools()] : [])],
    // `devtools: {}` makes `sanity build` emit a Rolldown build session that the DevTools dock can inspect
    build: isViteDevToolsEnabled ? {rolldownOptions: {devtools: {}}} : {},
  },
})

import {createRequire} from 'node:module'

import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {DevTools} from '@vitejs/devtools'
import {defineCliConfig} from 'sanity/cli'
import {mergeConfig, type UserConfig} from 'vite'

const require = createRequire(import.meta.url)

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'
const appId = process.env.SANITY_STUDIO_APP_ID || 'bi1ktslqwmu1cawds5ce3jn6'
// Enables Vite DevTools (https://devtools.vite.dev) for both `sanity dev` and `sanity build`.
// During `sanity build` it records a Rolldown build session, which can then be inspected from
// the DevTools dock in a running `sanity dev` server without restarting it.
// Usage: `pnpm devtools:test-studio` from the repo root (see AGENTS.md).
const isViteDevToolsEnabled = process.env.ENABLE_VITE_DEVTOOLS === 'true'
// Enable React production profiling on Vercel preview deployments (PR builds), but not on
// production (plugins-studio.sanity.dev) where the react-dom/profiling overhead is unwanted.
const isVercelPreview = process.env.VERCEL_ENV === 'preview'

export default defineCliConfig({
  api: {projectId, dataset},
  deployment: {
    appId,
    // Auto-updates vendor builds hardcode `react-dom-client.production.js`, which bypasses
    // the `react-dom/client` → `react-dom/profiling` alias below. Disable on Vercel previews
    // so profiling can take effect; keep enabled for production / sanity deploy.
    autoUpdates: !isVercelPreview,
  },
  reactCompiler: {},
  typegen: {formatGeneratedCode: false},
  // Bundle studio deps in `sanity dev` (required for Structure with client/eventsource alignment).
  // Trade-off: with this on, editing a `.css.ts` (vanilla-extract) file does not hot-reload —
  // the change only takes effect after restarting `sanity dev`. Plain `.ts`/`.tsx` HMR still
  // works fine. If you're actively working on styles and need CSS HMR, comment out this line
  // for that session (confirmed fast, sub-10ms HMR with it unset).
  unstable_bundledDev: true,
  vite(viteConfig, {command}): UserConfig {
    let nextConfig = mergeConfig(viteConfig, {
      plugins: [vanillaExtractPlugin(), ...(isViteDevToolsEnabled ? [DevTools()] : [])],
      // `devtools: {}` makes `sanity build` emit a Rolldown build session that the DevTools dock can inspect
      build: isViteDevToolsEnabled ? {rolldownOptions: {devtools: {}}} : {},
      define: {
        'process.env.SANITY_E2E_PROJECT_ID': JSON.stringify(process.env.SANITY_E2E_PROJECT_ID),
        'process.env.SANITY_E2E_DATASET': JSON.stringify(process.env.SANITY_E2E_DATASET),
        'process.env.SANITY_E2E_DATASET_CHROMIUM': JSON.stringify(
          process.env.SANITY_E2E_DATASET_CHROMIUM,
        ),
        'process.env.SANITY_E2E_DATASET_FIREFOX': JSON.stringify(
          process.env.SANITY_E2E_DATASET_FIREFOX,
        ),
      },
    } satisfies UserConfig)

    // Support React Production Profiling on Vercel preview deployments
    if (isVercelPreview && command === 'build') {
      nextConfig = mergeConfig(nextConfig, {
        // Aliasing to react-dom/profiling is necessary in the production build, otherwise React
        // can't run the profiler on the deployed studio
        resolve: {alias: {'react-dom/client': require.resolve('react-dom/profiling')}},
        build: {
          // Enable production source maps to easier debug deployed preview studios
          sourcemap: true,
          rolldownOptions: {
            output: {
              // Disabling `mangle` (while keeping compression and whitespace removal) ensures that
              // the React DevTools components inspector has readable component names.
              // This overrides the `build.minify: 'oxc'` default set by `sanity build`, replacing
              // `esbuild: {minifyIdentifiers: false}` which the rolldown-powered Vite silently ignores.
              minify: {compress: true, mangle: false, codegen: true},
            },
          },
        },
      } satisfies UserConfig)
    }

    return nextConfig
  },
})

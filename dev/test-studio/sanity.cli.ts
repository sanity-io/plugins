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
// Enable React production profiling on Vercel preview and production deployments
// (`VERCEL_ENV=development` is left alone).
const reactProductionProfiling =
  process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'production'

export default defineCliConfig({
  api: {projectId, dataset},
  deployment: {
    appId,
    // Auto-updates vendor builds hardcode `react-dom-client.production.js`, which bypasses
    // the `react-dom/client` → `react-dom/profiling` alias below. Disable when profiling so
    // the alias can take effect; keep enabled for non-Vercel sanity deploys.
    autoUpdates: !reactProductionProfiling,
  },
  reactCompiler: {transform: 'oxc'},
  typegen: {formatGeneratedCode: false},
  // Bundle studio deps in `sanity dev` (required for Structure with client/eventsource alignment).
  unstable_bundledDev: true,
  vite(viteConfig, {command}): UserConfig {
    let nextConfig = mergeConfig(viteConfig, {
      plugins: [vanillaExtractPlugin(), ...(isViteDevToolsEnabled ? [DevTools()] : [])],
      // `@sanity/themer` resolves to its source here, so its `*.module.css` files are compiled by
      // Vite rather than by the plugin's build (`@tsdown/css`, Lightning CSS). Compiling them with
      // Lightning CSS here too keeps the two alike: it scopes `view-transition-class`es,
      // `container-name`s and `@keyframes` along with the classes, where PostCSS modules would
      // leave the first two global, and with the pattern of the plugin's `tsdown.config.ts`
      // (`generateScopedName`, hashing each stylesheet's content) the studio renders the very names
      // the build ships. The CLI's own `lightningcss.exclude` (`Features.LightDark`) survives the merge.
      css: {
        transformer: 'lightningcss',
        lightningcss: {cssModules: {pattern: '[content-hash]_[local]'}},
      },
      // `devtools: {}` makes `sanity build` emit a Rolldown build session that the DevTools dock can inspect
      build: isViteDevToolsEnabled ? {rolldownOptions: {devtools: {}}} : {},
    } satisfies UserConfig)

    // Support React production profiling on Vercel preview/production builds
    if (reactProductionProfiling && command === 'build') {
      nextConfig = mergeConfig(nextConfig, {
        // Aliasing to react-dom/profiling is necessary in the production build, otherwise React
        // can't run the profiler on the deployed studio
        resolve: {alias: {'react-dom/client': require.resolve('react-dom/profiling')}},
        build: {
          // Enable production source maps to more easily debug deployed Vercel studios
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

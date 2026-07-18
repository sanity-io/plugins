import {readFile} from 'node:fs/promises'

import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {DevTools} from '@vitejs/devtools'
import {defineCliConfig} from 'sanity/cli'
import type {Plugin} from 'vite'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'
const appId = process.env.SANITY_STUDIO_APP_ID || 'bi1ktslqwmu1cawds5ce3jn6'
// Enables Vite DevTools (https://devtools.vite.dev) for both `sanity dev` and `sanity build`.
// During `sanity build` it records a Rolldown build session, which can then be inspected from
// the DevTools dock in a running `sanity dev` server without restarting it.
// Usage: `pnpm devtools:test-studio` from the repo root (see AGENTS.md).
const isViteDevToolsEnabled = process.env.ENABLE_VITE_DEVTOOLS === 'true'

/**
 * `@bynder/compact-view` ships `Styles.css.js` — a plain JS module exporting a CSS string, not a
 * vanilla-extract module — but its name matches vanilla-extract's `cssFileFilter`. When the
 * Bynder modal's lazy chunk is compiled on demand (`unstable_bundledDev`), the vanilla-extract
 * compiler's `fetchModule` for that file deadlocks and crashes `sanity dev`. Resolve the module
 * to an id the filter doesn't match so the vanilla-extract plugin leaves it alone. Only this
 * source-consuming studio needs the workaround — consumer studios pre-bundle the package.
 */
function bynderStylesCssJsWorkaround(): Plugin {
  const suffix = '.bynder-workaround.mjs'
  return {
    name: 'bynder-compact-view-styles-css-js-workaround',
    enforce: 'pre',
    resolveId: {
      filter: {id: /Styles\.css\.js$/},
      async handler(source, importer, options) {
        if (!importer?.includes('@bynder/compact-view')) return null
        const resolved = await this.resolve(source, importer, options)
        return resolved ? resolved.id + suffix : null
      },
    },
    load: {
      filter: {id: /Styles\.css\.js\.bynder-workaround\.mjs$/},
      handler(id) {
        return readFile(id.slice(0, -suffix.length), 'utf8')
      },
    },
  }
}

export default defineCliConfig({
  api: {projectId, dataset},
  deployment: {appId, autoUpdates: true},
  reactCompiler: {},
  typegen: {formatGeneratedCode: false},
  // Bundle studio deps in `sanity dev` (required for Structure with client/eventsource alignment).
  // Trade-off: with this on, editing a `.css.ts` (vanilla-extract) file does not hot-reload —
  // the change only takes effect after restarting `sanity dev`. Plain `.ts`/`.tsx` HMR still
  // works fine. If you're actively working on styles and need CSS HMR, comment out this line
  // for that session (confirmed fast, sub-10ms HMR with it unset).
  unstable_bundledDev: true,
  vite: {
    plugins: [
      bynderStylesCssJsWorkaround(),
      vanillaExtractPlugin(),
      ...(isViteDevToolsEnabled ? [DevTools()] : []),
    ],
    // `devtools: {}` makes `sanity build` emit a Rolldown build session that the DevTools dock can inspect
    build: isViteDevToolsEnabled ? {rolldownOptions: {devtools: {}}} : {},
  },
})

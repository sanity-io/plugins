import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  styledComponents: true,
  reactCompiler: {transform: 'oxc'},
  // lexorank@1.0.5 is CommonJS-only and unmaintained. Studio schema extraction
  // loads the config in a Vite worker with `ssr.noExternal: true`, which evaluates
  // that CJS as ESM and throws `exports is not defined` (sanity deploy aborts).
  // Inline it so the published bundle never imports the package.
  // The inlined copy has an internal cycle (lexoRank <-> lexoRankBucket). That
  // cycle is how the CommonJS package already worked; the bundle wraps it.
  suppressWarnings: 'lexorank/lib/',
  deps: {
    alwaysBundle: ['lexorank'],
    // Fail the build if any other dependency gets pulled into the bundle.
    onlyBundle: ['lexorank'],
  },
}) satisfies Promise<UserConfig | UserConfig[]>

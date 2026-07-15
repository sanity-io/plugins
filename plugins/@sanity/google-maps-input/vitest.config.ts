import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineConfig} from 'vitest/config'

// The package-exports test resolves this package's own workspace `exports` map, whose `.`
// entry points at `./src/index.ts` (for monorepo-internal dev consumption) rather than
// `dist/index.js`, so it transitively imports real `.css.ts` source files and needs this
// plugin to compile them.
//
// The `./bundle.css` entry's `node`/`default` condition points at `dist/bundle.css.js`, an
// intentionally-empty Node/SSR compat shim (see its own comment) for runtimes that can't import
// `.css` files directly. Its filename alone matches the upstream `cssFileFilter` vanilla-extract
// Vite plugins use to find `.css.ts` output (`*.css.js`), so `vanillaExtractPlugin()` tries to
// evaluate it as real `.css.ts` source through its internal compiler server regardless of
// content. That server externalizes the vanilla-extract runtime as a `require(...)` call, which
// throws `ReferenceError: require is not defined` once evaluated via Vite's `ModuleRunner` (the
// legacy `@vanilla-extract/vite-plugin`, evaluating through `vite-node` instead, tolerated this).
// Stub it out as an empty module before `vanillaExtractPlugin()` ever sees it.
export default defineConfig({
  plugins: [
    {
      name: 'stub-bundle-css-js-shim',
      enforce: 'pre',
      resolveId(source) {
        return source.endsWith('/dist/bundle.css.js')
          ? '\0google-maps-input-bundle-css-js-shim'
          : null
      },
      load(id) {
        return id === '\0google-maps-input-bundle-css-js-shim' ? '' : null
      },
    },
    vanillaExtractPlugin(),
  ],
  test: {
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})

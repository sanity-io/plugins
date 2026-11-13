import {defineConfig} from '@sanity/tsdown-config'
import {Features} from 'lightningcss'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    legacy: './src/legacy/index.ts',
    tool: './src/tool/index.ts',
  },
  // `target: '19'` emits `react/compiler-runtime` imports, which the React 19.3 peer range ships
  reactCompiler: {target: '19', transform: 'oxc'},
  // Compiles the `*.module.css` files with Lightning CSS, through `@tsdown/css`,
  // and extracts the CSS into `dist/bundle.css` — the stylesheet the package
  // has always published, wired up as the conditional `./bundle.css` export
  // (`browser`/`style` resolve to the stylesheet, `node`/`default` to a no-op
  // shim), like `@sanity/vision` ships its styles. The `tool` entry is the only
  // one with styles, so it is the only one that gets the self-referential
  // `import '@sanity/themer/bundle.css'` injected — which is why package.json
  // lists `./dist/tool.js` in `sideEffects` next to `*.css`: flagged
  // side-effect free, bundlers may bypass the entry and drop the bare CSS
  // import with it before the stylesheet's own side-effect status is consulted
  css: {
    fileName: 'bundle.css',
    // Readable output keeps CSS diffs between published versions easy to review
    minify: false,
    modules: {
      // Lightning CSS's `cssModules.pattern`: how it renames the classes — and
      // the `view-transition-class`es, `container-name`s and `@keyframes` it
      // scopes along with them. Hashing the stylesheet's content rather than
      // its path does two things. A release that changes a file's styles gets
      // new names for them, so a page that loads the stylesheets of two
      // releases can't style elements with the wrong release's rules (what
      // `identifiers: 'safe'` did for vanilla-extract). And the test studio,
      // which compiles the same files with Vite (`dev/test-studio/sanity.cli.ts`
      // mirrors this pattern), produces the very names this build ships.
      // `@tsdown/css` sets `cssModules` itself from this option, over anything
      // in `lightningcss` below, so the rest of the scoping stays at Lightning
      // CSS's defaults
      generateScopedName: '[content-hash]_[local]',
    },
    lightningcss: {
      // The `@sanity/browserslist-config` targets predate `light-dark()`, and
      // Lightning CSS polyfills it with `--lightningcss-light`/`-dark` toggles
      // added to every `color-scheme` declaration rather than by following the
      // computed `color-scheme`, so both ship as authored instead. See
      // https://github.com/parcel-bundler/lightningcss/issues/873
      exclude: Features.LightDark,
    },
  },
}) satisfies Promise<UserConfig | UserConfig[]>

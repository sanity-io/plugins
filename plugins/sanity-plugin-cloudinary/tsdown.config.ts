import {defineConfig} from '@sanity/tsdown-config'
import {Features} from 'lightningcss'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  // `target: '19'` emits `react/compiler-runtime` imports, which the React 19.3 peer range ships
  reactCompiler: {target: '19', transform: 'oxc'},
  // Compiles the `*.module.css` files with Lightning CSS, through `@tsdown/css`,
  // and extracts the CSS into `dist/bundle.css` — wired up as the conditional
  // `./bundle.css` export (`browser`/`style` resolve to the stylesheet,
  // `node`/`default` to a no-op shim). The main entry gets the self-referential
  // `import 'sanity-plugin-cloudinary/bundle.css'` injected — which is why
  // package.json lists `./dist/index.js` in `sideEffects` next to `*.css`
  css: {
    fileName: 'bundle.css',
    // Readable output keeps CSS diffs between published versions easy to review
    minify: false,
    modules: {
      // Lightning CSS's `cssModules.pattern`: how it renames the classes.
      // Hashing the stylesheet's content rather than its path does two things.
      // A release that changes a file's styles gets new names for them, so a
      // page that loads the stylesheets of two releases can't style elements
      // with the wrong release's rules. And the test studio, which compiles the
      // same files with Vite (`dev/test-studio/sanity.cli.ts` mirrors this
      // pattern), produces the very names this build ships.
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

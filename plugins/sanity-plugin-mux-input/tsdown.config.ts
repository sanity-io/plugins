import {defineConfig} from '@sanity/tsdown-config'
import {Features} from 'lightningcss'
import type {UserConfig} from 'tsdown'

import pkg from './package.json' with {type: 'json'}

export default defineConfig({
  entry: ['./src/_exports/index.ts'],
  reactCompiler: {transform: 'oxc'},
  // Compiles the `*.module.css` files with Lightning CSS, through `@tsdown/css`, and extracts the
  // CSS into `dist/bundle.css` — the stylesheet the package has always published, wired up as the
  // conditional `./bundle.css` export. See `plugins/@sanity/themer/tsdown.config.ts` for the
  // reference setup this mirrors.
  css: {
    fileName: 'bundle.css',
    // Readable output keeps CSS diffs between published versions easy to review
    minify: false,
    modules: {
      // Hashes each stylesheet's content rather than its path, so a release that changes a file's
      // styles gets new names for them, and the test studio (which compiles the same files with
      // Vite, see `dev/test-studio/sanity.cli.ts`) produces the very names this build ships
      generateScopedName: '[content-hash]_[local]',
    },
    lightningcss: {
      // The `@sanity/browserslist-config` targets predate `light-dark()`, and Lightning CSS
      // polyfills it with `--lightningcss-light`/`-dark` toggles added to every `color-scheme`
      // declaration rather than by following the computed `color-scheme`, so both ship as
      // authored instead. See https://github.com/parcel-bundler/lightningcss/issues/873
      exclude: Features.LightDark,
    },
  },
  define: {__PKG_VERSION__: JSON.stringify(pkg.version)},
}) satisfies Promise<UserConfig | UserConfig[]>

import {defineConfig} from '@sanity/tsdown-config'
import {Features} from 'lightningcss'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  reactCompiler: {transform: 'oxc'},
  // Compiles `*.module.css` with Lightning CSS through `@tsdown/css`, and
  // extracts the CSS into `dist/bundle.css` (conditional `./bundle.css` export).
  css: {
    fileName: 'bundle.css',
    minify: false,
    modules: {
      // Hash stylesheet content so a release that changes styles gets new
      // class names (same idea as vanilla-extract `identifiers: 'safe'`), and
      // so the test studio's Vite Lightning CSS modules pattern matches.
      generateScopedName: '[content-hash]_[local]',
    },
    lightningcss: {
      // Keep `light-dark()` authored; Lightning CSS polyfills it poorly against
      // our browserslist targets. See https://github.com/parcel-bundler/lightningcss/issues/873
      exclude: Features.LightDark,
    },
  },
}) satisfies Promise<UserConfig | UserConfig[]>

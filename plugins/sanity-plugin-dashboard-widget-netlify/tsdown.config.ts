import {defineConfig} from '@sanity/tsdown-config'
import {Features} from 'lightningcss'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  reactCompiler: {transform: 'oxc'},
  // Compiles `*.module.css` with Lightning CSS through `@tsdown/css` and extracts
  // `dist/bundle.css` (wired as the conditional `./bundle.css` export).
  css: {
    fileName: 'bundle.css',
    minify: false,
    modules: {
      // Hash stylesheet content so scoped names match the test studio Vite
      // Lightning CSS config (`dev/test-studio/sanity.cli.ts`).
      generateScopedName: '[content-hash]_[local]',
    },
    lightningcss: {
      // Keep `light-dark()` as authored — Lightning CSS's polyfill does not
      // follow computed `color-scheme`. See parcel-bundler/lightningcss#873.
      exclude: Features.LightDark,
    },
  },
}) satisfies Promise<UserConfig | UserConfig[]>

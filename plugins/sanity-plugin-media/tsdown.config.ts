import {defineConfig} from '@sanity/tsdown-config'
import {Features} from 'lightningcss'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  // `FolderView`'s drag-and-drop highlight is still styled-components; the rest of the
  // plugin's styling is CSS modules (`css` below).
  styledComponents: true,
  reactCompiler: {transform: 'oxc'},
  // Compiles the `*.module.css` files with Lightning CSS, through `@tsdown/css`, and
  // extracts the CSS into `dist/bundle.css` — the stylesheet the package has always
  // published, wired up as the conditional `./bundle.css` export (`browser`/`style`
  // resolve to the stylesheet, `node`/`default` to a no-op shim).
  css: {
    fileName: 'bundle.css',
    // Readable output keeps CSS diffs between published versions easy to review
    minify: false,
    modules: {
      // Lightning CSS's `cssModules.pattern`: how it renames the classes. Hashing the
      // stylesheet's content rather than its path means a release that changes a file's
      // styles gets new names for them, so a page that loads the stylesheets of two
      // releases can't style elements with the wrong release's rules. The test studio,
      // which compiles the same files with Vite (`dev/test-studio/sanity.cli.ts` mirrors
      // this pattern), produces the very names this build ships.
      generateScopedName: '[content-hash]_[local]',
    },
    lightningcss: {
      // The `@sanity/browserslist-config` targets predate `light-dark()`, and Lightning
      // CSS polyfills it with `--lightningcss-light`/`-dark` toggles added to every
      // `color-scheme` declaration rather than by following the computed `color-scheme`,
      // so both ship as authored instead. See
      // https://github.com/parcel-bundler/lightningcss/issues/873
      exclude: Features.LightDark,
    },
  },
}) satisfies Promise<UserConfig | UserConfig[]>

import {defineConfig} from '@sanity/tsdown-config'
import {Features} from 'lightningcss'
import type {TsdownPlugin, UserConfig} from 'tsdown'

/**
 * `@tsdown/css` injects `import "sanity-plugin-markdown/bundle.css"` into every
 * entry that transitively uses `*.module.css`. The `/next` entry must stay
 * CSS-import-free for Next.js `pages` (see README) — consumers import easymde +
 * bundle.css in `_app.tsx` instead.
 */
const stripBundleCssFromNextEntry = {
  name: 'strip-bundle-css-from-next-entry',
  generateBundle(_options, bundle) {
    const chunk = bundle['next.js']
    if (chunk?.type !== 'chunk') return
    chunk.code = chunk.code.replace(/^import ["']sanity-plugin-markdown\/bundle\.css["'];\n/, '')
  },
} satisfies TsdownPlugin

async function createConfig(): Promise<UserConfig> {
  const config = await defineConfig({
    entry: {
      index: './src/index.ts',
      next: './src/indexNext.ts',
    },
    reactCompiler: {transform: 'oxc'},
    // Compiles the `*.module.css` files with Lightning CSS, through `@tsdown/css`,
    // and extracts the CSS into `dist/bundle.css` — wired up as the conditional
    // `./bundle.css` export. The `index` entry is the one with styles, so it is
    // the one that gets the self-referential `import 'sanity-plugin-markdown/bundle.css'`
    // injected (then stripped from `next` above) — which is why package.json
    // lists `./dist/index.js` in `sideEffects` next to `*.css`
    css: {
      fileName: 'bundle.css',
      // Readable output keeps CSS diffs between published versions easy to review
      minify: false,
      modules: {
        // Lightning CSS's `cssModules.pattern`: hashing the stylesheet's content
        // rather than its path, matching `@sanity/themer` and the test studio's
        // Vite `lightningcss.cssModules.pattern`
        generateScopedName: '[content-hash]_[local]',
      },
      lightningcss: {
        // The `@sanity/browserslist-config` targets predate `light-dark()`, and
        // Lightning CSS polyfills it with `--lightningcss-light`/`-dark` toggles
        // rather than by following the computed `color-scheme`
        exclude: Features.LightDark,
      },
    },
  })

  return {
    ...config,
    plugins: [
      ...(Array.isArray(config.plugins) ? config.plugins : []),
      stripBundleCssFromNextEntry,
    ],
  }
}

export default createConfig() satisfies Promise<UserConfig | UserConfig[]>

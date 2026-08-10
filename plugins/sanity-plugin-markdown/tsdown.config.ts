import {defineConfig} from '@sanity/tsdown-config'
import type {TsdownPlugin, UserConfig} from 'tsdown'

/**
 * `vanillaExtract: true` injects `import "sanity-plugin-markdown/bundle.css"` into every entry
 * that transitively uses `.css.ts` styles. The `/next` entry must stay CSS-import-free for
 * Next.js `pages` (see README) — consumers import easymde + bundle.css in `_app.tsx` instead.
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
    reactCompiler: true,
    vanillaExtract: true,
  })

  return {
    ...config,
    plugins: [
      ...(Array.isArray(config.plugins) ? config.plugins : []),
      stripBundleCssFromNextEntry,
    ],
  }
}

export default createConfig()

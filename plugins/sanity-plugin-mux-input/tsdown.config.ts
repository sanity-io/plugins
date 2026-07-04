import {readFileSync} from 'node:fs'

import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

// Same behavior as the built-in `process.env.PKG_VERSION` define in `@sanity/pkg-utils`:
// an explicit env var wins, otherwise the version from package.json is inlined.
const {version}: {version: string} = JSON.parse(
  readFileSync(new URL('package.json', import.meta.url), 'utf8'),
)

export default defineConfig({
  entry: ['./src/_exports/index.ts'],
  styledComponents: true,
  dts: {tsgo: true},
  define: {
    'process.env.PKG_VERSION': JSON.stringify(process.env['PKG_VERSION'] || version),
  },
}) satisfies Promise<UserConfig>

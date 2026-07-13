import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

import pkg from './package.json' with {type: 'json'}

export default defineConfig({
  entry: ['./src/_exports/index.ts'],
  styledComponents: true,
  reactCompiler: true,
  dts: {tsgo: true},
  define: {__PKG_VERSION__: JSON.stringify(pkg.version)},
}) satisfies Promise<UserConfig>

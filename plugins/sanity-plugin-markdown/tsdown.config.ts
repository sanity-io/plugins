import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    next: './src/indexNext.ts',
  },
  styledComponents: true,
  reactCompiler: true,
  dts: {tsgo: true},
}) satisfies Promise<UserConfig>

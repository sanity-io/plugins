import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  entry: {
    'index': './src/index.ts',
    'migrations/index': './migrations/index.ts',
  },
  reactCompiler: true,
  dts: {tsgo: true},
}) satisfies Promise<UserConfig>

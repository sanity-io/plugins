import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    next: './src/indexNext.ts',
  },
  reactCompiler: true,
  vanillaExtract: true,
}) satisfies Promise<UserConfig>

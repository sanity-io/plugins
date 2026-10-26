import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  entry: {
    'index': './src/index.ts',
    'migrations/index': './migrations/index.ts',
  },
  reactCompiler: {transform: 'oxc'},
  vanillaExtract: {identifiers: 'safe'},
}) satisfies Promise<UserConfig | UserConfig[]>

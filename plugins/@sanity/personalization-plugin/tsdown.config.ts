import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts', './src/launchDarkly/index.ts', './src/growthbook/index.ts'],
  reactCompiler: true,
}) satisfies Promise<UserConfig>

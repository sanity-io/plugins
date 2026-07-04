import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  reactCompiler: true,
  dts: {tsgo: true},
}) satisfies Promise<UserConfig>

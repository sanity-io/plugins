import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  dts: {tsgo: true},
}) satisfies Promise<UserConfig>

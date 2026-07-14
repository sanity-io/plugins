import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  reactCompiler: true,
  vanillaExtract: true,
}) satisfies Promise<UserConfig>

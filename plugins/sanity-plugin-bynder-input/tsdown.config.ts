import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  reactCompiler: {transform: 'oxc'},
  vanillaExtract: {identifiers: 'safe'},
}) satisfies Promise<UserConfig | UserConfig[]>

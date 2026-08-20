import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  reactCompiler: {transform: 'oxc'},
}) satisfies Promise<UserConfig | UserConfig[]>

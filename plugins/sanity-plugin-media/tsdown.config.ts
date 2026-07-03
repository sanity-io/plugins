import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  styledComponents: true,
}) satisfies Promise<UserConfig>

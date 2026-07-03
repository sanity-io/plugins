import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  entry: [
    './src/formium/index.ts',
    './src/hubspot/index.ts',
    './src/mailchimp/index.ts',
    './src/form-schema/index.ts',
    './src/form-renderer/index.ts',
  ],
  reactCompiler: true,
  dts: {tsgo: true},
}) satisfies Promise<UserConfig>

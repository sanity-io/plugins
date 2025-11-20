import { defineConfig } from '@sanity/pkg-utils'
import config from '@repo/package.config'

export default defineConfig({
  ...config,
  babel: { reactCompiler: true },
  reactCompilerOptions: { target: '18' },
})

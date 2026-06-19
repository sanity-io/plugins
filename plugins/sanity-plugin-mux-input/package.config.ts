import config from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...config,
  babel: {styledComponents: true},
  external: (prev) => prev.filter((dep) => dep !== 'use-error-boundary'),
})

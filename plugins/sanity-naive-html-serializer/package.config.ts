import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  dist: 'dist',
  tsconfig: 'tsconfig.dist.json',
  extract: {
    rules: {
      'ae-missing-release-tag': 'off',
    },
  },
})

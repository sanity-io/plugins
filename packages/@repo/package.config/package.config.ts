import { defineConfig, type PkgConfigOptions } from '@sanity/pkg-utils'

import config from './src/index.ts'

export default defineConfig({
  ...config, strictOptions: {
    ...config.strictOptions,
    alwaysPackageJsonFiles: 'off',
    alwaysPackageJsonTypes: 'off',
  }
}) as PkgConfigOptions

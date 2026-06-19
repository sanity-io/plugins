import fs from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import type {loadConfig as LoadConfig, PkgConfigOptions} from '@sanity/pkg-utils'

// Config file candidates supported by `@sanity/pkg-utils`.
const CONFIG_FILE_NAMES = [
  'package.config.ts',
  'package.config.js',
  'package.config.cjs',
  'package.config.mts',
  'package.config.mjs',
]

/**
 * Loads the `@sanity/pkg-utils` package.config file for the plugin in `basePath`.
 *
 * `@sanity/pkg-utils` is a peer dependency, so we resolve `loadConfig` from the plugin's own
 * installation (relative to `basePath`). This guarantees the config is parsed with the exact
 * same pkg-utils version the plugin builds with, and lets plugin-kit run via `npx` without
 * bundling its own copy of pkg-utils.
 */
export async function loadPackageConfig(options: {
  basePath: string
}): Promise<PkgConfigOptions | undefined> {
  const {basePath} = options

  // Cheap check first: avoid resolving the pkg-utils peer when there's no config to load.
  const hasConfigFile = CONFIG_FILE_NAMES.some((file) => fs.existsSync(path.join(basePath, file)))
  if (!hasConfigFile) {
    return undefined
  }

  const pkgPath = path.join(basePath, 'package.json')
  const require = createRequire(pkgPath)
  const pkgUtilsEntry = require.resolve('@sanity/pkg-utils')
  const {loadConfig} = (await import(pathToFileURL(pkgUtilsEntry).href)) as {
    loadConfig: typeof LoadConfig
  }

  return loadConfig({cwd: basePath, pkgPath})
}

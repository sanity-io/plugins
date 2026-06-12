import fs from 'fs'
import path from 'path'

import {PkgConfigOptions} from '@sanity/pkg-utils'
import {createJiti} from 'jiti'

// Mirrors the config file candidates supported by `@sanity/pkg-utils`
const CONFIG_FILE_NAMES = [
  'package.config.ts',
  'package.config.js',
  'package.config.cjs',
  'package.config.mts',
  'package.config.mjs',
]

const jiti = createJiti(import.meta.url)

/**
 * Loads the `@sanity/pkg-utils` package.config file for the plugin in `basePath`.
 *
 * Loads the config with jiti instead of `loadConfig` from `@sanity/pkg-utils`: the latter is
 * tsx-based and cannot load TypeScript config files from CommonJS plugins on Node 24
 * (`ERR_MODULE_NOT_FOUND` with a `?namespace=` suffix), and returns the config double-wrapped
 * in `default` on older Node versions. Most plugins built with plugin-kit are CommonJS packages.
 */
export async function loadPackageConfig(options: {
  basePath: string
}): Promise<PkgConfigOptions | undefined> {
  const {basePath} = options
  const configFile = CONFIG_FILE_NAMES.map((file) => path.join(basePath, file)).find((file) =>
    fs.existsSync(file),
  )

  if (!configFile) {
    return undefined
  }

  const config = await jiti.import<PkgConfigOptions>(configFile, {default: true})
  return config ?? undefined
}

// oxlint-disable eslint/no-await-in-loop - legacy code will be lint-cleaned in a follow-up PR
import path from 'path'

import {fileExists} from '../util/files'

const studioConfigFiles = ['sanity.config.js', 'sanity.config.ts', 'sanity.cli.js', 'sanity.cli.ts']

/**
 * Detects a Sanity Studio config file (`sanity.config.*` or `sanity.cli.*`) in `basePath`.
 * Used by init/inject to refuse operating inside a Studio instead of a plugin package.
 */
export async function findStudioConfig(basePath: string) {
  for (const configFile of studioConfigFiles) {
    if (await fileExists(path.join(basePath, configFile))) {
      return {configFile}
    }
  }
  return {configFile: undefined}
}

import path from 'path'

import {fileExists} from '../util/files'

/**
 * Detects a Sanity Studio config file in `basePath`.
 * Used by init/inject to refuse operating inside a Studio instead of a plugin package.
 */
export async function findStudioConfig(basePath: string) {
  const jsFile = 'sanity.config.js'
  const jsExists = await fileExists(path.join(basePath, jsFile))
  if (jsExists) {
    return {configFile: jsFile}
  }
  const tsFile = 'sanity.config.ts'
  const tsExists = await fileExists(path.join(basePath, tsFile))
  return {configFile: tsExists ? tsFile : undefined}
}

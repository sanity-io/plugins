import path from 'path'

// The JS compiler API is loaded from the official `@typescript/typescript6` compat package
// instead of the `typescript` peer dependency, as TypeScript 7 (the Go-native compiler) no longer
// ships it
import * as ts from '@typescript/typescript6'

import {fileExists} from './files'

export async function readTSConfig(options: {basePath: string; filename: string}) {
  const {basePath, filename} = options
  const filePath = path.resolve(basePath, filename)
  const exists = await fileExists(filePath)

  if (!exists) return undefined

  const {config} = ts.readConfigFile(filePath, ts.sys.readFile)

  if (!config) return undefined

  return ts.parseJsonConfigFileContent(config, ts.sys, basePath)
}

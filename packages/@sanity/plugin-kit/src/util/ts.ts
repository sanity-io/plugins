import path from 'path'

import * as ts from 'typescript'

import {fileExists} from './files'

export async function readTSConfig(options: {basePath: string; filename: string}) {
  const {basePath, filename} = options
  const filePath = path.resolve(basePath, filename)
  const exists = await fileExists(filePath)

  if (!exists) return undefined

  // oxlint-disable-next-line typescript/unbound-method - TypeScript API requires readFile callback
  const {config} = ts.readConfigFile(filePath, ts.sys.readFile)

  if (!config) return undefined

  return ts.parseJsonConfigFileContent(config, ts.sys, basePath)
}

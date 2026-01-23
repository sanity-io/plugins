import {readFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {expect, test} from 'vitest'

test('package exports', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const packagePath = resolve(__dirname, '../package.json')
  const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'))

  expect(pkg.exports).toMatchInlineSnapshot(`
    {
      ".": {
        "default": "./dist/index.js",
        "development": "./src/index.ts",
        "require": "./dist/index.cjs",
        "source": "./src/index.ts",
      },
      "./next": {
        "default": "./dist/indexNext.js",
        "development": "./src/indexNext.ts",
        "source": "./src/indexNext.ts",
      },
      "./package.json": "./package.json",
    }
  `)
})

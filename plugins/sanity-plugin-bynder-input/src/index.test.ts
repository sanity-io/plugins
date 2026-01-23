import {fileURLToPath} from 'node:url'
import {expect, test} from 'vitest'
import {getPackageExportsManifest} from 'vitest-package-exports'

test('package exports', async () => {
  const manifest = await getPackageExportsManifest({
    importMode: 'dist',
    cwd: fileURLToPath(import.meta.url),
  })

  expect(manifest.exports).toMatchInlineSnapshot(`
      {
        ".": {
          "BynderDiff": "function",
          "BynderInput": "function",
          "bynderAssetSchema": "object",
          "bynderInputPlugin": "function",
        },
      }
    `)
}, 30000)

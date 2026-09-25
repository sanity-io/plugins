import {fileURLToPath} from 'node:url'

import {expect, test} from 'vitest'
import {getPackageExportsManifest} from 'vitest-package-exports'

test('package exports', {timeout: 30_000}, async () => {
  const manifest = await getPackageExportsManifest({
    importMode: 'dist',
    cwd: fileURLToPath(import.meta.url),
  })

  expect(manifest.exports).toMatchInlineSnapshot(`
    {
      ".": {
        "LexoDecimal": "function",
        "LexoInteger": "function",
        "LexoNumeralSystem10": "function",
        "LexoNumeralSystem36": "function",
        "LexoNumeralSystem64": "function",
        "LexoRank": "function",
        "LexoRankBucket": "function",
      },
    }
  `)
})

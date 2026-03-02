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
        "ColorInput": "object",
        "color": "object",
        "colorInput": "function",
        "hslaColor": "object",
        "hsvaColor": "object",
        "rgbaColor": "object",
      },
    }
  `)
})

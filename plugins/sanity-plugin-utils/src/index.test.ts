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
        "Cell": "function",
        "Feedback": "function",
        "Row": "function",
        "Table": "function",
        "UserSelectMenu": "function",
        "useImageUrlBuilder": "function",
        "useImageUrlBuilderImage": "function",
        "useListeningQuery": "function",
        "useOpenInNewPane": "function",
        "useProjectUsers": "function",
      },
    }
  `)
})

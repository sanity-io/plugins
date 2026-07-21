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
        "BaseDocumentDeserializer": "object",
        "BaseDocumentMerger": "object",
        "BaseDocumentSerializer": "function",
        "LANGUAGE_FIELD": "string",
        "customBlockDeserializers": "object",
        "customSerializers": "object",
        "defaultStopTypes": "object",
        "getItemLanguage": "function",
        "usesLanguageField": "function",
      },
    }
  `)
})

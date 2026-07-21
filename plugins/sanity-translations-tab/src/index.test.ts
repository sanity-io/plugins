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
        "DummyAdapter": "object",
        "TranslationsTab": "function",
        "baseDocumentLevelConfig": "object",
        "baseFieldLevelConfig": "object",
        "baseI18nArrayConfig": "object",
        "customSerializers": "object",
        "defaultStopTypes": "object",
        "documentLevelPatch": "function",
        "fieldLevelPatch": "function",
        "findLatestDraft": "function",
        "i18nArrayPatch": "function",
        "legacyDocumentLevelConfig": "object",
        "legacyDocumentLevelPatch": "function",
      },
    }
  `)
})

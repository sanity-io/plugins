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
        "BLOCKQUOTE_PATTERN": "object",
        "BlockInsertPicker": "function",
        "CODE_FENCE_PATTERN": "object",
        "MarkdownInputRules": "function",
        "blockInsertPicker": "function",
        "blockquoteRule": "function",
        "codeFenceRule": "function",
        "derivePickerItems": "function",
        "fenceLanguageFromMatch": "function",
        "filterPickerItems": "function",
        "normalizeFenceLanguage": "function",
        "standardBlockPresets": "object",
        "wellKnownInputRules": "object",
      },
    }
  `)
})

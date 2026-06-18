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
      "./form-renderer": {
        "FormRenderer": "function",
      },
      "./form-schema": {
        "formSchema": "function",
      },
      "./formium": {
        "formiumInput": "function",
      },
      "./hubspot": {
        "fetchHubSpotData": "function",
        "hubSpotHandler": "function",
        "hubSpotInput": "function",
      },
      "./mailchimp": {
        "fetchMailchimpData": "function",
        "mailchimpHandler": "function",
        "mailchimpInput": "function",
      },
    }
  `)
})

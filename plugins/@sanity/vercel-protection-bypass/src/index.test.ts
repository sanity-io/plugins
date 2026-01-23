import {fileURLToPath} from 'node:url'
import {describe, expect, test} from 'vitest'
import {getPackageExportsManifest} from 'vitest-package-exports'

describe('package exports', () => {
  test('all exports are valid and can be imported', async () => {
    const manifest = await getPackageExportsManifest({
      // Test source files in development
      importMode: 'src',
      cwd: fileURLToPath(import.meta.url),
    })

    // Verify that the package has exports
    expect(manifest.exports).toBeDefined()
    expect(Object.keys(manifest.exports).length).toBeGreaterThan(0)

    // Verify that all exports can be imported without errors
    for (const [exportName, exportInfo] of Object.entries(manifest.exports)) {
      if (exportInfo['import'] && !exportName.includes('package.json')) {
        expect(exportInfo['import']).toBeTruthy()
      }
    }
  })
})

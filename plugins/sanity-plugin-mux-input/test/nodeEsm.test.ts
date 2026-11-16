import {execFile} from 'node:child_process'
import {promisify} from 'node:util'

import {expect, test} from 'vitest'

const execFileAsync = promisify(execFile)

// Vitest's interop lets named imports from CommonJS packages through, so the
// built entry has to be loaded by a plain Node process, the way Next.js or a
// Node script importing `sanity.config.ts` loads it.
test('dist loads under plain Node ESM', {timeout: 30_000}, async () => {
  const entry = new URL('../dist/index.js', import.meta.url).href
  const {stdout} = await execFileAsync(process.execPath, [
    '--input-type=module',
    '-e',
    'const mod = await import(process.argv[1]); console.log(Object.keys(mod).sort().join(","))',
    entry,
  ])

  expect(stdout.trim()).toBe('defaultConfig,muxInput')
})

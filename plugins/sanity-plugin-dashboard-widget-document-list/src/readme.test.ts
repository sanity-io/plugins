import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

import {expect, test} from 'vitest'

test('readme documents queryParams for custom queries', () => {
  const readme = readFileSync(fileURLToPath(new URL('../README.md', import.meta.url)), 'utf8')
  const customQuerySection = readme.slice(
    readme.indexOf('### `query`'),
    readme.indexOf('### `createButtonText`'),
  )

  expect(customQuerySection).toContain('### `query` (string) and `queryParams` (object)')
  expect(customQuerySection).toContain('queryParams:')
  expect(customQuerySection).not.toMatch(/^\s*params:/m)
})

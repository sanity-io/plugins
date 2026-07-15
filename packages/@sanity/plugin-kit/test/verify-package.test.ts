import {expect, test} from 'vitest'

import {verifyPackageConfigDefaults} from '../src/actions/verify/verify-common'
import {runCliCommand, testFixture} from './fixture-utils'

test(
  'plugin-kit verify-package in package with all checks failing',
  {timeout: 120_000},
  async () => {
    await testFixture({
      fixturePath: 'verify-package/every-failure-possible',
      command: ({fixtureDir}) => runCliCommand('verify-package', [fixtureDir]),
      assert: async ({result: {stderr}}) => {
        const redactFilePaths = cleanupOutput(
          stderr,
          /[\S]+verify-package\/every-failure-possible\//g,
        )

        // to regenerate the snapshot, run: pnpm test -u
        expect(redactFilePaths, 'stderr should match snapshot').toMatchSnapshot()

        // checks that output contains the "skip this validation" snippet for every possible relevant key
        // will fail when new checks are added that we may or may not want to account for
        Object.keys(verifyPackageConfigDefaults)
          .filter((key) => key !== 'studioConfig')
          .forEach((checkKey) => {
            const findString = `"${checkKey}": false`
            expect(stderr, `should include ${findString} in stderr`).toContain(findString)
          })
      },
    })
  },
)

test('plugin-kit verify-package in ok package', {timeout: 120_000}, async () => {
  await testFixture({
    fixturePath: 'verify-package/valid',
    command: ({fixtureDir}) => runCliCommand('verify-package', [fixtureDir]),
    assert: async ({result: {stdout, stderr}}) => {
      expect(stderr, 'stderr should be empty').toBe('')

      // to regenerate the snapshot, run: pnpm test -u
      const redactFilePaths = cleanupOutput(stdout, /[\S]+verify-package\/valid\//g)
      expect(redactFilePaths, 'stdout should match snapshot').toMatchSnapshot()
    },
  })
})

test('plugin-kit verify-studio in fresh v2 studio', {timeout: 120_000}, async () => {
  await testFixture({
    fixturePath: 'verify-package/fresh-v2-movie-studio',
    command: ({fixtureDir}) => runCliCommand('verify-studio', [fixtureDir]),
    assert: async ({result: {stderr}}) => {
      // to regenerate the snapshot, run: pnpm test -u
      const redactFilePaths = cleanupOutput(stderr, /[\S]+verify-package\/fresh-v2-movie-studio\//g)
      expect(redactFilePaths, 'stderr should match snapshot').toMatchSnapshot()
    },
  })
})

function cleanupOutput(val: string, packagePath: RegExp) {
  return val
    .split('\\')
    .join('/')
    .replace('D://', '')
    .replace(packagePath, 'root/')
    .replace(/\((.+)\/node_modules\//g, 'root/node_modules/')
    .replace(/\[\d+m/g, '')
}

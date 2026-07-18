import {cpSync} from 'fs'
import path from 'path'

import {expect, test} from 'vitest'

import {fileContainsValidator, runCliCommand, testFixture} from './fixture-utils'

test(
  'plugin-kit inject --preset semver-workflow into existing plugin directory',
  {timeout: 120_000},
  async () => {
    await testFixture({
      fixturePath: 'inject/valid',
      relativeOutPath: '../semver-workflow',
      command: async ({fixtureDir, outputDir}) => {
        cpSync(fixtureDir, outputDir, {recursive: true})
        return runCliCommand('inject', [outputDir, '--preset-only', '--preset', 'semver-workflow'])
      },
      assert: async ({result: {stdout, stderr}, outputDir}) => {
        expect(stderr, 'should have empty stderr').toBe('')
        expect(stdout).toContain(`Only apply presets, skipping default inject.`)
        expect(stdout).toContain(`Inject config into plugin in "${outputDir}"`)

        const fileContains = fileContainsValidator(outputDir)

        // only check for a single file from the preset:
        // rest is covered by the init tests; it uses the same codepath
        await fileContains(path.join('.github', 'workflows', 'main.yml'), 'CI & Release')

        // plugins are ESM ("type": "module") and the shared oxlint config bans CommonJS,
        // so the preset's config files must use `export default`, not `module.exports`
        await fileContains('lint-staged.config.js', 'export default')
        await fileContains('commitlint.config.js', 'export default')
      },
    })
  },
)

test(
  'plugin-kit inject --preset renovatebot into existing plugin directory',
  {timeout: 120_000},
  async () => {
    await testFixture({
      fixturePath: 'inject/valid',
      relativeOutPath: '../renovatebot',
      command: async ({fixtureDir, outputDir}) => {
        cpSync(fixtureDir, outputDir, {recursive: true})
        return runCliCommand('inject', [outputDir, '--preset-only', '--preset', 'renovatebot'])
      },
      assert: async ({result: {stderr}, outputDir}) => {
        expect(stderr, 'should have empty stderr').toBe('')

        const fileContains = fileContainsValidator(outputDir)

        await fileContains(
          path.join('renovate.json'),
          '"github>sanity-io/renovate-presets//ecosystem/auto"',
        )
      },
    })
  },
)

test('plugin-kit inject --preset-only requires --preset', {timeout: 120_000}, async () => {
  await testFixture({
    fixturePath: 'inject/valid',
    command: async ({fixtureDir}) => {
      return runCliCommand('inject', [fixtureDir, '--preset-only'])
    },
    assert: async ({result: {stderr}}) => {
      expect(stderr).toContain('--preset-only, but no --preset [preset-name] was provided.')
    },
  })
})

test('plugin-kit inject --preset-only --preset does-not-exist', {timeout: 120_000}, async () => {
  await testFixture({
    fixturePath: 'inject/valid',
    command: async ({fixtureDir}) => {
      return runCliCommand('inject', [fixtureDir, '--preset-only', '--preset', 'does-not-exist'])
    },
    assert: async ({result: {stderr}}) => {
      expect(stderr).toContain('Unknown --preset(s): [does-not-exist]. Must be one of: [')
    },
  })
})

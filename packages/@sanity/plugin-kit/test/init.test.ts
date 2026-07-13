import path from 'path'

import {expect, test} from 'vitest'

import type {PackageJson} from '../src/actions/verify/types'
import {fileExists} from '../src/util/files'
import {
  fileContainsValidator,
  initTestArgs,
  normalize,
  pluginTestName,
  readFile,
  runCliCommand,
  testFixture,
} from './fixture-utils'

const defaultDevDependencies = [
  '@sanity/pkg-utils',
  '@sanity/plugin-kit',
  '@types/react',
  'oxfmt',
  'oxlint',
  'oxlint-tsgolint',
  'react',
  'react-dom',
  'sanity',
  'styled-components',
  'typescript',
]

test('plugin-kit init --force in empty directory', {timeout: 120_000}, async () => {
  await testFixture({
    fixturePath: 'init/empty',
    relativeOutPath: 'defaults',
    command: ({outputDir}) => runCliCommand('init', [outputDir, ...initTestArgs]),
    assert: async ({result: {stdout, stderr}, outputDir}) => {
      expect(stderr, 'should have empty stderr').toBe('')
      expect(stdout).toContain(`Initializing new plugin in "${outputDir}"`)

      const fileContains = fileContainsValidator(outputDir)

      await fileContains('LICENSE', 'MIT')
      await fileContains('README.md', `# ${pluginTestName}`)
      await fileContains('.gitignore', 'dist')
      await fileContains('.oxlintrc.json', './node_modules/@sanity/plugin-kit/oxlint-config.json')
      await fileContains('oxfmt.config.ts', `export {default} from '@sanity/plugin-kit/oxfmt'`)
      await fileContains('tsconfig.json', '"extends": "./tsconfig.settings"')
      await fileContains('tsconfig.dist.json', '"extends": "./tsconfig.settings"')
      await fileContains('tsconfig.settings.json', '"target": "esnext"')

      await fileContains('src/index.ts', `name: '${pluginTestName}'`)

      // The legacy @sanity/incompatible-plugin v2 shim should no longer be scaffolded
      expect(
        await fileExists(path.join(outputDir, 'sanity.json')),
        'sanity.json should not be scaffolded',
      ).toBe(false)
      expect(
        await fileExists(path.join(outputDir, 'v2-incompatible.js')),
        'v2-incompatible.js should not be scaffolded',
      ).toBe(false)

      const pkg: PackageJson = JSON.parse(await readFile(path.join(outputDir, 'package.json')))

      expect(pkg, 'package.json has expected content').toMatchObject({
        name: pluginTestName,
        version: '1.0.0',
        description: '',
        // author: 'Omitted from validation',
        license: 'MIT',
        type: 'module',
        exports: {
          '.': {
            source: './src/index.ts',
            default: './dist/index.js',
          },
        },
        types: './dist/index.d.ts',
        files: ['dist'],
        scripts: {
          'format': 'oxfmt',
          'lint': 'oxlint',
          'build': 'plugin-kit verify-package --silent && pkg-utils build --strict --check --clean',
          'watch': 'pkg-utils watch --strict',
          'link-watch': 'plugin-kit link-watch',
          'prepublishOnly': 'npm run build',
        },
        repository: {
          type: 'git',
          url: 'https://github.com/sanity-io/sanity',
        },
        engines: {
          node: '>=20.19 <22 || >=22.12',
        },
        bugs: {
          url: 'https://github.com/sanity-io/sanity/issues',
        },
        homepage: 'https://github.com/sanity-io/sanity#readme',
      })

      expect(Object.keys(pkg.dependencies ?? {}), 'should have empty dependencies').toEqual([])
      expect(
        Object.keys(pkg.peerDependencies ?? {}),
        'should have expected peerDependencies',
      ).toEqual(['react', 'sanity'])

      expect(
        Object.keys(pkg.devDependencies ?? {}),
        'should have expected devDependencies',
      ).toEqual(defaultDevDependencies)
    },
  })
})

test(
  'plugin-kit init --force with all the opt-outs in empty directory',
  {timeout: 120_000},
  async () => {
    await testFixture({
      fixturePath: 'init/empty',
      relativeOutPath: 'opt-out',
      command: ({outputDir}) =>
        runCliCommand('init', [
          outputDir,
          ...initTestArgs.filter((a) => a !== '--license' && a !== 'mit'),
          '--no-install',
          '--no-oxlint',
          '--no-oxfmt',
          '--no-typescript',
          '--no-license',
          '--no-editorconfig',
          '--no-gitignore',
          '--no-scripts',
        ]),
      assert: async ({result: {stdout, stderr}, outputDir}) => {
        expect(stderr, 'should have empty stderr').toBe('')
        expect(stdout).toContain(`Initializing new plugin in "${outputDir}"`)

        const fileContains = fileContainsValidator(outputDir)

        const expectNotExist = async (file: string) =>
          expect(
            await fileExists(path.join(outputDir, normalize(file))),
            `${file} should not exist`,
          ).toBe(false)

        await expectNotExist('LICENSE')
        await expectNotExist('.oxlintrc.json')
        await expectNotExist('.gitignore')
        await expectNotExist('oxfmt.config.ts')
        await expectNotExist('tsconfig.json')

        await fileContains('src/index.js', `name: '${pluginTestName}'`)

        const pkg: PackageJson = JSON.parse(await readFile(path.join(outputDir, 'package.json')))
        expect(pkg.scripts, 'scripts should be an empty object').toEqual({})

        expect(Object.keys(pkg.dependencies ?? {}), 'should have empty dependencies').toEqual([])
        expect(
          Object.keys(pkg.peerDependencies ?? {}),
          'should have expected peerDependencies',
        ).toEqual(['react', 'sanity'])
        expect(
          Object.keys(pkg.devDependencies ?? {}),
          'should have expected devDependencies',
        ).toEqual([
          '@sanity/pkg-utils',
          '@sanity/plugin-kit',
          'react',
          'react-dom',
          'sanity',
          'styled-components',
        ])
      },
    })
  },
)

test(
  'plugin-kit init --force --preset semver-workflow in empty directory',
  {timeout: 120_000},
  async () => {
    await testFixture({
      fixturePath: 'init/empty',
      relativeOutPath: 'defaults-semver-workflow',
      command: ({outputDir}) =>
        runCliCommand('init', [outputDir, ...initTestArgs, '--preset', 'semver-workflow']),
      assert: async ({result: {stderr}, outputDir}) => {
        expect(stderr, 'should have empty stderr').toBe('')

        const fileContains = fileContainsValidator(outputDir)

        await fileContains(path.join('.github', 'workflows', 'main.yml'), 'CI & Release')
        await fileContains(path.join('.husky', 'commit-msg'), 'npx --no -- commitlint')
        await fileContains(path.join('.husky', 'pre-commit'), 'npx lint-staged')
        await fileContains(path.join('.releaserc.json'), '@sanity/semantic-release-preset')
        await fileContains(path.join('commitlint.config.js'), '@commitlint/config-conventional')

        const pkg: PackageJson = JSON.parse(await readFile(path.join(outputDir, 'package.json')))

        expect(
          Object.keys(pkg.devDependencies ?? {}),
          'should have expected devDependencies',
        ).toEqual(
          [
            ...defaultDevDependencies,
            '@commitlint/cli',
            '@commitlint/config-conventional',
            '@sanity/semantic-release-preset',
            'husky',
            'lint-staged',
          ].sort(),
        )

        expect(pkg.scripts?.prepare).toBe('husky')
      },
    })
  },
)

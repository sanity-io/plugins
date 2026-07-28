import fs from 'fs/promises'
import path from 'path'
import {fileURLToPath} from 'url'

import {execa} from 'execa'
import {expect, test} from 'vitest'

import {contents, initTestArgs, normalize, runCliCommand, testFixture} from './fixture-utils'

const packageDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

test(
  'plugin-kit init -> verify-package -> oxlint -> pkg-utils build',
  {timeout: 600_000},
  async () => {
    await testFixture({
      fixturePath: 'init/empty',
      relativeOutPath: 'buildable',
      command: async ({outputDir}) => {
        // using console.error: we want these logged continuously to not surprise devs on the runtime
        console.error(
          'Integration testing init -> verify-package -> oxlint -> build.\nThis may take a while...',
        )
        let start = new Date().getTime()
        function seconds() {
          return `${(new Date().getTime() - start) / 1000}s`
        }
        const init = await runCliCommand('init', [outputDir, ...initTestArgs])
        expect(init.exitCode, `init failed:\n${init.stderr}`).toBe(0)
        console.error(
          `"plugin-kit init" done in ${seconds()}.\nRunning "plugin-kit verify-package"...`,
        )

        start = new Date().getTime()
        const verify = await runCliCommand('verify-package', [outputDir], {
          cwd: outputDir,
          preferLocal: true,
          localDir: packageDir,
        })
        expect(verify.exitCode, `verify-package failed:\n${verify.stderr}`).toBe(0)
        console.error(`"plugin-kit verify-package" done in ${seconds()}.\nRunning "oxlint"...`)

        // The scaffolded oxlint.config.ts re-exports @sanity/plugin-kit/oxlint, but init ran with
        // --no-install; link this plugin-kit checkout so the import resolves. Other packages
        // (sanity, react, typescript, ...) resolve by walking up to plugin-kit's own node_modules,
        // since the fixture lives inside this package.
        await fs.mkdir(path.join(outputDir, 'node_modules', '@sanity'), {recursive: true})
        await fs.symlink(
          packageDir,
          path.join(outputDir, 'node_modules', '@sanity', 'plugin-kit'),
          'junction',
        )

        start = new Date().getTime()
        const lint = await execa('oxlint', [], {
          cwd: outputDir,
          preferLocal: true,
          localDir: packageDir,
          reject: false,
        })
        expect(lint.exitCode, `oxlint failed:\n${lint.stdout}\n${lint.stderr}`).toBe(0)
        console.error(`"oxlint" done in ${seconds()}.\nRunning "pkg-utils build"...`)

        start = new Date().getTime()
        const build = await execa('pkg-utils', ['build'], {
          cwd: outputDir,
          preferLocal: true,
          localDir: packageDir,
        })
        console.error(`"pkg-utils build" done in ${seconds()}.`)

        return build
      },

      assert: async ({outputDir}) => {
        expect(
          await contents(path.join(outputDir, 'dist')),
          'should output expected files to dist',
        ).toEqual(['index.d.ts', 'index.js', 'index.js.map'].map(normalize))
      },
    })
  },
)

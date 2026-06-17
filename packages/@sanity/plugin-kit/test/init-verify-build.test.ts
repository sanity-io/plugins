import path from 'path'
import {fileURLToPath} from 'url'

import execa from 'execa'
import {expect, test} from 'vitest'

import {contents, initTestArgs, normalize, runCliCommand, testFixture} from './fixture-utils'

const packageDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

test('plugin-kit init -> verify-package -> tsc > pkg-utils build', {timeout: 600_000}, async () => {
  await testFixture({
    fixturePath: 'init/empty',
    relativeOutPath: 'buildable',
    command: async ({outputDir}) => {
      // using console.error: we want these logged continuously to not surprise devs on the runtime
      console.error(
        'Integration testing init -> verify-package -> tsc -> build.\nThis may take a while...',
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
      console.error(`"plugin-kit verify-package" done in ${seconds()}.\nRunning "tsc --build"...`)

      start = new Date().getTime()
      await execa('tsc', ['--build'], {
        cwd: outputDir,
        preferLocal: true,
        localDir: packageDir,
      })
      console.error(`"tsc --build" done in ${seconds()}.\nRunning "pkg-utils build"...`)

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
      ).toEqual(
        [
          'index.d.mts',
          'index.d.ts',
          'index.js',
          'index.js.map',
          'index.mjs',
          'index.mjs.map',
          'tsconfig.tsbuildinfo',
        ].map(normalize),
      )
    },
  })
})

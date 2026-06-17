import fs from 'fs/promises'
import path from 'path'
import {fileURLToPath} from 'url'

import execa from 'execa'
import {expect} from 'vitest'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const baseFixturesDir = path.join(testDir, 'fixtures')
const binPath = path.join(testDir, '..', 'bin', 'plugin-kit.js')

export const readFile = (file: string) => fs.readFile(file, 'utf8')

export async function contents(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, {recursive: true, withFileTypes: true})
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)))
}

export const normalize = (dirPath: string) => dirPath.replace(/\//g, path.sep)

export const pluginTestName = 'sanity-plugin-test-plugin'

export const initTestArgs = [
  '--force',
  '--no-install',
  '--name',
  pluginTestName,
  '--license',
  'mit',
  '--author',
  'Test Person <test.person@somewhere-on-the-internet.nowhere>',
  '--repo',
  'https://github.com/sanity-io/sanity',
]

export async function testFixture({
  fixturePath,
  relativeOutPath = 'dist',
  command,
  assert,
}: {
  fixturePath: string
  relativeOutPath?: string
  command: (args: {fixtureDir: string; outputDir: string}) => Promise<execa.ExecaReturnValue>
  assert: (args: {result: execa.ExecaReturnValue; outputDir: string}) => Promise<void>
}) {
  const fixtureDir = path.join(baseFixturesDir, normalize(fixturePath))
  const outputDir = path.join(fixtureDir, normalize(relativeOutPath))

  await fs.rm(outputDir, {recursive: true, force: true})

  const result = await command({fixtureDir, outputDir})
  await assert({result, outputDir})

  await fs.rm(outputDir, {recursive: true, force: true})
}

export function fileContainsValidator(outputDir: string) {
  return async (file: string, ...contains: string[]) => {
    const fileString = await readFile(path.join(outputDir, normalize(file)))
    contains.forEach((content) =>
      expect(fileString, `${file} contains ${content}`).toContain(content),
    )
  }
}

export function runCliCommand(command: string, args: string[] = [], options?: execa.Options) {
  return execa('node', [binPath, command, ...args].filter(Boolean), {
    cwd: testDir,
    reject: false,
    ...options,
  })
}

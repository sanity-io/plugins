import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import {afterEach, beforeEach, describe, expect, test} from 'vitest'

import {validateOxlintConfig} from '../src/actions/verify/validations'

const sharedConfigExtends = JSON.stringify({
  extends: ['./node_modules/@sanity/plugin-kit/oxlint-config.json'],
})

let tmpDir: string

beforeEach(async () => {
  // Use the real tmpdir (outside this repository) so walking up from the plugin directory does
  // not accidentally detect the sanity-io/plugins monorepo root.
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-kit-oxlint-'))
})

afterEach(async () => {
  await fs.rm(tmpDir, {recursive: true, force: true})
})

async function write(relativePath: string, content: string) {
  const filePath = path.join(tmpDir, relativePath)
  await fs.mkdir(path.dirname(filePath), {recursive: true})
  await fs.writeFile(filePath, content, 'utf8')
}

describe('standalone plugin (no monorepo detected)', () => {
  test('fails when no oxlint config exists next to package.json', async () => {
    const errors = await validateOxlintConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Could not find an oxlint config file next to package.json')
    expect(errors[0]).toContain('@sanity/plugin-kit/oxlint-config.json')
  })

  test('passes when .oxlintrc.json extends the shared plugin-kit config', async () => {
    await write('.oxlintrc.json', sharedConfigExtends)
    expect(await validateOxlintConfig(tmpDir, {})).toEqual([])
  })

  test('fails when the config does not extend the shared plugin-kit config', async () => {
    await write('.oxlintrc.json', JSON.stringify({rules: {'no-console': 'error'}}))
    const errors = await validateOxlintConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('does not extend the shared plugin-kit config')
  })

  test('fails when multiple oxlint configs exist', async () => {
    await write('.oxlintrc.json', sharedConfigExtends)
    await write('.oxlintrc.jsonc', sharedConfigExtends)
    const errors = await validateOxlintConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Found multiple oxlint config files')
  })
})

describe('monorepo (workspace root detected)', () => {
  test('passes when the workspace root has a config extending the shared config', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    await write('.oxlintrc.json', sharedConfigExtends)
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')
    await fs.mkdir(pluginDir, {recursive: true})

    expect(await validateOxlintConfig(pluginDir, {})).toEqual([])
  })

  test('fails when the workspace root has no oxlint config', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')
    await fs.mkdir(pluginDir, {recursive: true})

    const errors = await validateOxlintConfig(pluginDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Could not find an oxlint config file in the workspace root')
  })

  test('accepts a config next to the plugin package.json as a fallback', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    await write(path.join('packages', 'plugin', '.oxlintrc.json'), sharedConfigExtends)
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')

    expect(await validateOxlintConfig(pluginDir, {})).toEqual([])
  })
})

describe('legacy eslint configuration', () => {
  test('fails when eslint config files remain', async () => {
    await write('.oxlintrc.json', sharedConfigExtends)
    await write('.eslintrc', `{"extends": ["sanity"]}\n`)
    await write('.eslintignore', `dist\n`)

    const errors = await validateOxlintConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Found legacy eslint configuration: [.eslintrc, .eslintignore]')
    expect(errors[0]).toContain('plugin-kit has replaced eslint with oxlint')
  })

  test('fails when a flat eslint config remains', async () => {
    await write('.oxlintrc.json', sharedConfigExtends)
    await write('eslint.config.mjs', `export default []\n`)

    const errors = await validateOxlintConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('eslint.config.mjs')
  })

  test('fails when package.json contains an eslintConfig key', async () => {
    await write('.oxlintrc.json', sharedConfigExtends)

    const errors = await validateOxlintConfig(tmpDir, {eslintConfig: {extends: ['sanity']}})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('package.json ("eslintConfig" key)')
  })
})

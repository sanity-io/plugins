import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import {afterEach, beforeEach, describe, expect, test} from 'vitest'

import {validateOxlintConfig} from '../src/actions/verify/validations'

const sharedConfigReExport = `export {default} from '@sanity/plugin-kit/oxlint'\n`

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
    expect(errors[0]).toContain(`export {default} from '@sanity/plugin-kit/oxlint'`)
  })

  test('passes when oxlint.config.ts re-exports the shared plugin-kit config', async () => {
    await write('oxlint.config.ts', sharedConfigReExport)
    expect(await validateOxlintConfig(tmpDir, {})).toEqual([])
  })

  test('passes when the shared config is extended in a custom config', async () => {
    await write(
      'oxlint.config.ts',
      `import sanityPluginKitOxlint from '@sanity/plugin-kit/oxlint'\nimport {defineConfig} from 'oxlint'\n\nexport default defineConfig({extends: [sanityPluginKitOxlint]})\n`,
    )
    expect(await validateOxlintConfig(tmpDir, {})).toEqual([])
  })

  test('fails when the config does not use the shared plugin-kit config', async () => {
    await write('oxlint.config.ts', `export default {rules: {'no-console': 'error'}}\n`)
    const errors = await validateOxlintConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('does not use the shared plugin-kit config')
  })

  test('fails for JSON configs, which cannot reuse the shared config', async () => {
    await write('.oxlintrc.json', JSON.stringify({rules: {'no-console': 'error'}}))
    const errors = await validateOxlintConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('JSON configs cannot reuse the shared plugin-kit config')
  })

  test('fails when multiple oxlint configs exist', async () => {
    await write('oxlint.config.ts', sharedConfigReExport)
    await write('.oxlintrc.json', JSON.stringify({rules: {}}))
    const errors = await validateOxlintConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Found multiple oxlint config files')
  })
})

describe('monorepo (workspace root detected)', () => {
  test('passes when the workspace root has a config using the shared config', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    await write('oxlint.config.ts', sharedConfigReExport)
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
    await write(path.join('packages', 'plugin', 'oxlint.config.ts'), sharedConfigReExport)
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')

    expect(await validateOxlintConfig(pluginDir, {})).toEqual([])
  })

  test('fails when a local config without the shared config overrides a valid workspace root config', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    await write('oxlint.config.ts', sharedConfigReExport)
    await write(
      path.join('packages', 'plugin', 'oxlint.config.ts'),
      `export default {rules: {'no-console': 'error'}}\n`,
    )
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')

    const errors = await validateOxlintConfig(pluginDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('does not use the shared plugin-kit config')
    expect(errors[0]).toContain('overrides the workspace root config')
  })

  test('fails when a local JSON config overrides a valid workspace root config', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    await write('oxlint.config.ts', sharedConfigReExport)
    await write(
      path.join('packages', 'plugin', '.oxlintrc.json'),
      JSON.stringify({rules: {'no-console': 'error'}}),
    )
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')

    const errors = await validateOxlintConfig(pluginDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('JSON configs cannot reuse the shared plugin-kit config')
  })

  test('detects legacy eslint configs left at the workspace root', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    await write('oxlint.config.ts', sharedConfigReExport)
    await write('.eslintrc', `{"extends": ["sanity"]}\n`)
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')
    await fs.mkdir(pluginDir, {recursive: true})

    const errors = await validateOxlintConfig(pluginDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain(
      'Found legacy eslint configuration: [.eslintrc (in the workspace root)]',
    )
  })

  test('detects an eslintConfig key in the workspace root package.json', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    await write('package.json', JSON.stringify({name: 'root', eslintConfig: {extends: ['sanity']}}))
    await write('oxlint.config.ts', sharedConfigReExport)
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')
    await fs.mkdir(pluginDir, {recursive: true})

    const errors = await validateOxlintConfig(pluginDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain(
      'Found legacy eslint configuration: [package.json ("eslintConfig" key, in the workspace root)]',
    )
  })
})

describe('legacy eslint configuration', () => {
  test('fails when eslint config files remain', async () => {
    await write('oxlint.config.ts', sharedConfigReExport)
    await write('.eslintrc', `{"extends": ["sanity"]}\n`)
    await write('.eslintignore', `dist\n`)

    const errors = await validateOxlintConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Found legacy eslint configuration: [.eslintrc, .eslintignore]')
    expect(errors[0]).toContain('plugin-kit has replaced eslint with oxlint')
  })

  test('fails when a flat eslint config remains', async () => {
    await write('oxlint.config.ts', sharedConfigReExport)
    await write('eslint.config.mjs', `export default []\n`)

    const errors = await validateOxlintConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('eslint.config.mjs')
  })

  test('fails when package.json contains an eslintConfig key', async () => {
    await write('oxlint.config.ts', sharedConfigReExport)

    const errors = await validateOxlintConfig(tmpDir, {eslintConfig: {extends: ['sanity']}})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('package.json ("eslintConfig" key)')
  })
})

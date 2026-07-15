import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import {afterEach, beforeEach, describe, expect, test} from 'vitest'

import {validateOxfmtConfig} from '../src/actions/verify/validations'

const presetConfig = `export {default} from '@sanity/plugin-kit/oxfmt'\n`

let tmpDir: string

beforeEach(async () => {
  // Use the real tmpdir (outside this repository) so walking up from the plugin directory does
  // not accidentally detect the sanity-io/plugins monorepo root.
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-kit-oxfmt-'))
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
  test('fails when no oxfmt config exists next to package.json', async () => {
    const errors = await validateOxfmtConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Could not find an oxfmt config file next to package.json')
    expect(errors[0]).toContain(`export {default} from '@sanity/plugin-kit/oxfmt'`)
  })

  test('passes when oxfmt.config.ts re-exports the plugin-kit preset', async () => {
    await write('oxfmt.config.ts', presetConfig)
    expect(await validateOxfmtConfig(tmpDir, {})).toEqual([])
  })

  test('passes when the preset is spread into a custom config', async () => {
    await write(
      'oxfmt.config.ts',
      `import pluginKitOxfmt from '@sanity/plugin-kit/oxfmt'\n\nexport default {...pluginKitOxfmt, printWidth: 80}\n`,
    )
    expect(await validateOxfmtConfig(tmpDir, {})).toEqual([])
  })

  test('fails when the config does not use the plugin-kit preset', async () => {
    await write('oxfmt.config.ts', `export default {semi: false}\n`)
    const errors = await validateOxfmtConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('does not use the shared plugin-kit preset')
  })

  test('fails for JSON configs, which cannot reuse the preset', async () => {
    await write('.oxfmtrc.json', `{"semi": false}\n`)
    const errors = await validateOxfmtConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('JSON configs cannot reuse the shared plugin-kit preset')
  })

  test('fails when multiple oxfmt configs exist', async () => {
    await write('oxfmt.config.ts', presetConfig)
    await write('.oxfmtrc.json', `{"semi": false}\n`)
    const errors = await validateOxfmtConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Found multiple oxfmt config files')
  })
})

describe('monorepo (workspace root detected)', () => {
  test('passes when the pnpm workspace root has a config using the preset', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    await write('oxfmt.config.ts', presetConfig)
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')
    await fs.mkdir(pluginDir, {recursive: true})

    expect(await validateOxfmtConfig(pluginDir, {})).toEqual([])
  })

  test('detects workspace roots declared via package.json workspaces', async () => {
    await write('package.json', JSON.stringify({name: 'root', workspaces: ['packages/*']}))
    await write('oxfmt.config.ts', presetConfig)
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')
    await fs.mkdir(pluginDir, {recursive: true})

    expect(await validateOxfmtConfig(pluginDir, {})).toEqual([])
  })

  test('fails when the workspace root has no oxfmt config', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')
    await fs.mkdir(pluginDir, {recursive: true})

    const errors = await validateOxfmtConfig(pluginDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Could not find an oxfmt config file in the workspace root')
  })

  test('fails when the workspace root config does not use the preset', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    await write('oxfmt.config.ts', `export default {semi: false}\n`)
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')
    await fs.mkdir(pluginDir, {recursive: true})

    const errors = await validateOxfmtConfig(pluginDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('does not use the shared plugin-kit preset')
  })

  test('accepts a config next to the plugin package.json as a fallback', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    await write(path.join('packages', 'plugin', 'oxfmt.config.ts'), presetConfig)
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')

    expect(await validateOxfmtConfig(pluginDir, {})).toEqual([])
  })

  test('fails when a local config without the preset overrides a valid workspace root config', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    await write('oxfmt.config.ts', presetConfig)
    await write(
      path.join('packages', 'plugin', 'oxfmt.config.ts'),
      `export default {semi: false}\n`,
    )
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')

    const errors = await validateOxfmtConfig(pluginDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('does not use the shared plugin-kit preset')
    expect(errors[0]).toContain('overrides the workspace root config')
  })

  test('fails when a local JSON config overrides a valid workspace root config', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    await write('oxfmt.config.ts', presetConfig)
    await write(path.join('packages', 'plugin', '.oxfmtrc.json'), `{"semi": false}\n`)
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')

    const errors = await validateOxfmtConfig(pluginDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('JSON configs cannot reuse the shared plugin-kit preset')
  })

  test('detects legacy prettier configs left at the workspace root', async () => {
    await write('pnpm-workspace.yaml', `packages:\n  - packages/*\n`)
    await write('oxfmt.config.ts', presetConfig)
    await write('.prettierrc', `{"semi": false}\n`)
    const pluginDir = path.join(tmpDir, 'packages', 'plugin')
    await fs.mkdir(pluginDir, {recursive: true})

    const errors = await validateOxfmtConfig(pluginDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain(
      'Found legacy prettier configuration: [.prettierrc (in the workspace root)]',
    )
  })
})

describe('legacy prettier configuration', () => {
  test('fails when a prettier config file remains', async () => {
    await write('oxfmt.config.ts', presetConfig)
    await write('.prettierrc', `{"semi": false}\n`)

    const errors = await validateOxfmtConfig(tmpDir, {})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Found legacy prettier configuration: [.prettierrc]')
    expect(errors[0]).toContain('oxfmt --migrate=prettier')
  })

  test('fails when package.json contains a prettier key', async () => {
    await write('oxfmt.config.ts', presetConfig)

    const errors = await validateOxfmtConfig(tmpDir, {prettier: {semi: false}})
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('package.json ("prettier" key)')
  })
})

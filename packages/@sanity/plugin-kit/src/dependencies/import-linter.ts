import fs from 'fs/promises'
import {createRequire} from 'node:module'
import os from 'os'
import path from 'path'

import execa from 'execa'
import outdent from 'outdent'

import {mergedPackages} from '../configs/banned-packages'
import {urls} from '../constants'
import log from '../util/log'

const require = createRequire(import.meta.url)

const removedImportSuffix = `imports where removed in Sanity v3. Please refer to the migration guide: ${urls.migrationGuideStudio}, or new API-reference docs: ${urls.refDocs}`

const restrictedImportPatterns = [
  ...mergedPackages.map((packageName) => ({
    group: [packageName, `${packageName}/**`],
    message: `Use sanity instead of ${packageName}.`,
  })),
  {
    group: ['config:*', 'config:*/**'],
    message: `config: imports are no longer supported. Please see the new plugin API for alternatives: ${urls.migrationGuideStudio}`,
  },
  {
    group: ['part:*', 'part:*/**'],
    message: `part: ${removedImportSuffix}`,
  },
  {
    group: ['all:part:*', 'all:part:*/**'],
    message: `all:part: ${removedImportSuffix}`,
  },
  {
    group: ['sanity:*', 'sanity:*/**'],
    message: `sanity: ${removedImportSuffix}`,
  },
]

/**
 * Config for the bundled oxlint that only checks for Studio v2 imports: everything else (including
 * the default `correctness` category) is turned off, so the result does not depend on the
 * package's own lint setup.
 */
const importsOxlintConfig = {
  categories: {correctness: 'off'},
  rules: {
    'eslint/no-restricted-imports': ['error', {patterns: restrictedImportPatterns}],
  },
}

function resolveOxlintBin(): string {
  const packageJsonPath = require.resolve('oxlint/package.json')
  const packageJson = require('oxlint/package.json') as {bin: Record<string, string>}
  return path.join(path.dirname(packageJsonPath), packageJson.bin.oxlint)
}

export async function validateImports({basePath}: {basePath: string}): Promise<string[]> {
  log.debug('Running oxlint with Sanity Studio import hints...')

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-kit-imports-'))
  const configPath = path.join(tempDir, 'imports.oxlintrc.json')

  try {
    await fs.writeFile(configPath, JSON.stringify(importsOxlintConfig), 'utf8')

    const result = await execa(
      'node',
      [
        resolveOxlintBin(),
        '--config',
        configPath,
        // Only use the imports-check config, never the package's own (nested) configs
        '--disable-nested-config',
        // Deterministic output regardless of environment (oxlint otherwise switches to GitHub
        // annotations on CI), with the per-diagnostic `help:` migration messages included
        '--format=agent',
        '--ignore-pattern',
        '**/dist/*',
        '--ignore-pattern',
        '**/.sanity/*',
        '.',
      ],
      {cwd: basePath, reject: false},
    )

    if (result.exitCode === 0) {
      return []
    }

    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()

    if (!output.includes('no-restricted-imports')) {
      log.error('Failed to run oxlint import check', output)
      return [
        outdent`
          Failed to run the oxlint-based import check:

          ${output}
      `,
      ]
    }

    return [
      output +
        '\n' +
        outdent`
        oxlint detected Studio V2 imports that are no longer available.
        Please migrate to the Sanity v3 APIs, or remove the restricted imports.

        To catch these directly in your editor and CI, add the same patterns to the
        "eslint/no-restricted-imports" rule in your .oxlintrc.json.

        If the package intentionally references these modules, disable this check.
    `,
    ]
  } catch (e) {
    log.error('Failed to run oxlint check', e)
    return [
      outdent`
        Failed to run oxlint. This is likely a bug in @sanity/plugin-kit - please report it.

        If needed, disable this check to move on.
    `,
    ]
  } finally {
    await fs.rm(tempDir, {recursive: true, force: true})
  }
}

import chalk from 'chalk'
import outdent from 'outdent'

import {cliName, defaultOutDir, urls} from '../constants'
import {validateImports} from '../dependencies/import-linter'
import {getPackage} from '../npm/package'
import {loadPackageConfig} from '../util/load-package-config'
import log from '../util/log'
import {readTSConfig} from '../util/ts'
import type {PackageJson} from './verify/types'
import {
  validateBabelConfig,
  validateEsmOnly,
  validateNodeEngine,
  validatePackageName,
  validatePackageType,
  validatePkgUtilsDependency,
  validatePkgUtilsVersion,
  validateIncompatiblePlugin,
  validateDeprecatedDependencies,
  validateScripts,
  validateTsConfig,
  validateSanityDependencies,
  validateSrcIndexFile,
  disallowDuplicateEslintConfig,
  disallowDuplicatePrettierConfig,
} from './verify/validations'
import {
  createValidator,
  runTscMaybe,
  type VerifyFlags,
  type VerifyPackageConfig,
} from './verify/verify-common'

export async function verifyPackage({basePath, flags}: {basePath: string; flags: VerifyFlags}) {
  let errors: string[] = []

  const packageJson: PackageJson = await getPackage({basePath, validate: false})
  const verifyConfig: VerifyPackageConfig = packageJson.sanityPlugin?.verifyPackage || {}

  // Hard requirements (not configurable via sanityPlugin.verifyPackage): plugins must be ESM and
  // ship a compatible @sanity/pkg-utils, since plugin-kit loads package.config.ts through it.
  for (const hardError of [
    ...validatePackageType(packageJson),
    ...validatePkgUtilsVersion({basePath}),
  ]) {
    errors.push(hardError)
    log.error(`\n${hardError}`)
  }

  // Load defensively: if the config can't be loaded (e.g. incompatible/missing pkg-utils), fall
  // back to defaults so the remaining checks still surface actionable issues.
  let packageConfig
  try {
    packageConfig = await loadPackageConfig({basePath})
  } catch (err) {
    log.debug('Failed to load package.config: %s', err)
  }
  const outDir = packageConfig?.dist ?? defaultOutDir
  const tsconfig = packageConfig?.tsconfig ?? 'tsconfig.json'

  const validation = createValidator(verifyConfig, flags, errors)

  const ts = await readTSConfig({basePath, filename: tsconfig})

  await validation('packageName', async () => validatePackageName(packageJson))
  await validation('esmOnly', async () => validateEsmOnly(packageJson))
  await validation('pkg-utils', async () => validatePkgUtilsDependency(packageJson))
  await validation('srcIndex', async () => validateSrcIndexFile(basePath))
  await validation('scripts', async () => validateScripts(packageJson))
  await validation('nodeEngine', async () => validateNodeEngine(packageJson))
  await validation('duplicateConfig', async () =>
    disallowDuplicateEslintConfig(basePath, packageJson),
  )
  await validation('duplicateConfig', async () =>
    disallowDuplicatePrettierConfig(basePath, packageJson),
  )

  if (ts) {
    await validation('tsconfig', async () => validateTsConfig(ts, {basePath, outDir, tsconfig}))
  }

  await validation('incompatiblePlugin', async () =>
    validateIncompatiblePlugin({basePath, packageJson}),
  )

  await validation('babelConfig', async () => validateBabelConfig({basePath}))

  await validation('dependencies', async () => validateSanityDependencies(packageJson))
  await validation('deprecatedDependencies', async () =>
    validateDeprecatedDependencies(packageJson),
  )
  await validation('eslintImports', async () => validateImports({basePath}))

  if (errors.length) {
    throw new Error(
      outdent`
        Detected validation issues!
        To make this package Sanity v3 compatible, fix the issues starting from the top, or disable any checks you deem unnecessary.

        These issues assume the package uses @sanity/plugin-kit defaults for development and building.
        Refer to ${urls.pluginReadme} for configuration options.

        More information is available here:
        - Studio migration guide: ${urls.migrationGuideStudio}
        - Plugin migration guide: ${urls.migrationGuidePlugin}
        - Reference documentation: ${urls.refDocs}

        ${chalk.grey(
          `To fail-fast on first detected issue run:\nnpx ${cliName} verify-package --single`,
        )}
      `.trimStart(),
    )
  }

  await runTscMaybe(verifyConfig, ts)

  log.success(
    outdent`
    No outstanding upgrade issues detected.

    Suggested next steps:
      - Use plugin-kit to build and develop the plugin according to ${urls.pluginReadme}.
      - Build the plugin and fix any compilation errors
      - Test the plugin using the link-watch command
  `.trim(),
  )
}

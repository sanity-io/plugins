// oxlint-disable eslint/no-await-in-loop, typescript/no-unsafe-type-assertion - legacy code will be lint-cleaned in a follow-up PR
import {createRequire} from 'node:module'
import path from 'path'

import chalk from 'chalk'
import outdent from 'outdent'
import type {ParsedCommandLine} from 'typescript'
import validateNpmPackageName from 'validate-npm-package-name'

import {deprecatedDevDeps, mergedPackages} from '../../configs/banned-packages'
import {
  incompatiblePluginPackage,
  minPkgUtilsMajor,
  requiredNodeEngine,
  urls,
} from '../../constants'
import {fileExists, readJson5File} from '../../util/files'
import type {PackageJson, SanityStudioJson, SanityV2Json} from './types'

export const expectedScripts = {
  'build': 'plugin-kit verify-package --silent && pkg-utils build --strict --check --clean',
  'watch': 'pkg-utils watch --strict',
  'link-watch': 'plugin-kit link-watch',
  'prepublishOnly': 'npm run build',
}

function filesWithSuffixes(fileBases: string[], suffixes: string[]): string[] {
  return fileBases.flatMap((file) => suffixes.map((suffix) => `${file}.${suffix}`))
}

export function validateNodeEngine(packageJson: PackageJson) {
  if (packageJson.engines?.node !== requiredNodeEngine) {
    return [
      outdent`
        Expected package.json to contain engines.node: "${requiredNodeEngine}" to match @sanity/pkg-utils,
        but it was: ${packageJson.engines?.node}

        Please add the following to package.json:

        "engines": {
          "node": "${requiredNodeEngine}"
        }`.trimStart(),
    ]
  }
  return []
}

export function validateScripts(packageJson: PackageJson): string[] {
  const errors: string[] = []

  const divergentScripts = Object.entries(expectedScripts).filter(([key, expectedCommand]) => {
    const command = packageJson.scripts?.[key]
    // check for includes instead of equals to give some leniency in command params and such
    return !command || !command.includes(expectedCommand)
  })

  if (divergentScripts.length) {
    errors.push(
      outdent`
      The following script commands did not contain expected defaults: ${divergentScripts
        .map(([key]) => key)
        .join(', ')}

      This checks for that the commands-strings includes these terms.

      Please add the following to your package.json "scripts":

      ${divergentScripts.map(([key, value]) => `"${key}": "${value}"`).join(',\n')}
  `.trimStart(),
    )
  }
  return errors
}

export async function validateTsConfig(
  ts: ParsedCommandLine,
  options: {basePath: string; outDir: string; tsconfig: string},
) {
  const {basePath, outDir, tsconfig} = options

  const errors: string[] = []

  const expectedCompilerOptions = {
    target: 'esnext',
    jsx: 'preserve',
    module: 'preserve',
    rootDir: '.',
    outDir,
    noEmit: true,
  }

  const wrongEntries = Object.entries(expectedCompilerOptions).filter(([key, value]) => {
    let option: any = ts.options[key]

    if (key === 'rootDir' && typeof option === 'string') {
      option = path.relative(basePath, option) || '.'
    }

    if (key === 'outDir' && typeof option === 'string') {
      option = path.relative(basePath, option) || '.'
    }

    if (key === 'target' && option === 99) {
      option = 'esnext'
    }

    if (key === 'module' && option === 200) {
      option = 'preserve'
    }

    if (key === 'jsx' && option === 1) {
      option = 'preserve'
    }

    return typeof value === 'string' && typeof option === 'string'
      ? value.toLowerCase() !== option?.toLowerCase()
      : value !== option
  })

  if (wrongEntries.length) {
    const expectedOutput = wrongEntries
      .map(([key, value]) => `"${key}": ${typeof value === 'string' ? `"${value}"` : value},`)
      .join('\n')

    errors.push(
      outdent`
        Recommended ${tsconfig} compilerOptions missing:

        The following fields had unexpected values: [${wrongEntries.map(([key]) => key).join(', ')}]
        Expected to find these values:
        ${expectedOutput}

        Please update your ${tsconfig} accordingly.
      `.trimStart(),
    )
  }

  return errors
}

/**
 * Hard requirement: plugins must be ESM (`"type": "module"`).
 *
 * plugin-kit loads `package.config.ts` through `@sanity/pkg-utils`, which can only load ESM
 * TypeScript configs reliably when the plugin itself is ESM. CommonJS (or an omitted `type`)
 * is not supported and cannot be opted out of.
 */
export function validatePackageType({type}: PackageJson): string[] {
  if (type === 'module') {
    return []
  }

  return [
    outdent`
      package.json must set "type": "module" — plugins built with @sanity/plugin-kit are ESM-only.
      Found: ${type ? `"type": "${type}"` : 'no "type" field (defaults to "commonjs")'}

      Please add the following to package.json:

      "type": "module"
  `.trimStart(),
  ]
}

/**
 * Recursively collects the locations of any `require` condition within a package.json `exports`
 * field. Conditions can be nested arbitrarily deep (and inside fallback arrays), so we walk the
 * whole tree rather than only inspecting the first level.
 *
 * Subpath keys always start with `.` (e.g. `"./feature"`), while condition keys never do, so an
 * exact `require` key is unambiguously a CommonJS export condition.
 */
function findRequireConditions(node: unknown, pathSegments: string[]): string[] {
  if (Array.isArray(node)) {
    return node.flatMap((entry, index) =>
      findRequireConditions(entry, [...pathSegments, String(index)]),
    )
  }

  if (!node || typeof node !== 'object') {
    return []
  }

  const found: string[] = []
  for (const [key, value] of Object.entries(node)) {
    if (key === 'require') {
      found.push(formatExportsPath(pathSegments))
    }
    found.push(...findRequireConditions(value, [...pathSegments, key]))
  }
  return found
}

function formatExportsPath(segments: string[]): string {
  return `exports${segments.map((segment) => `[${JSON.stringify(segment)}]`).join('')}`
}

/**
 * Bans CommonJS interop in package.json. The plugin baseline is Sanity Studio v5 or later, which is
 * pure ESM, so there is no reason to publish a parallel CJS build anymore. This flags:
 *
 * - `require` export conditions
 * - the top-level `main` field
 * - the top-level `module` field
 */
export function validateEsmOnly(packageJson: PackageJson): string[] {
  const offenders: string[] = []

  if (typeof packageJson.main !== 'undefined') {
    offenders.push(`- the top-level "main" field (${JSON.stringify(packageJson.main)})`)
  }

  if (typeof packageJson.module !== 'undefined') {
    offenders.push(`- the top-level "module" field (${JSON.stringify(packageJson.module)})`)
  }

  const requireConditions = [...new Set(findRequireConditions(packageJson.exports, []))]
  for (const conditionPath of requireConditions) {
    offenders.push(`- a "require" export condition at ${conditionPath}`)
  }

  if (!offenders.length) {
    return []
  }

  return [
    outdent`
      package.json ships CommonJS (CJS) output, but Sanity plugins target Sanity Studio v5+, which is pure ESM.

      Remove the following so the package stays ESM-only:
      ${offenders.join('\n')}

      Supporting CJS is not worth it:
      - It can have unintended side-effects.
      - The Node.js versions plugin-kit supports (${requiredNodeEngine}) fully support require(esm), so a
        consumer that still uses require() loads the ESM build directly — which is far more predictable.
      - Publishing a single format guarantees two copies of the plugin's code (ESM + CJS) can't both end up
        in the module tree, bloating bundles and slowing down builds.

      Rely on "exports" together with "type": "module", and drop "main", "module" and any "require" conditions.
  `.trimStart(),
  ]
}

export function validatePkgUtilsDependency({devDependencies}: PackageJson): string[] {
  if (!devDependencies?.['@sanity/pkg-utils']) {
    return [
      outdent`
        package.json does not list @sanity/pkg-utils as a devDependency.
        @sanity/pkg-utils replaced parcel as the recommended build tool in @sanity/plugin-kit 2.0.0

        Please add it by running 'npm install --save-dev @sanity/pkg-utils'.
    `.trimStart(),
    ]
  }
  return []
}

/**
 * Verifies that the installed `@sanity/pkg-utils` (the peer dependency plugin-kit loads
 * `package.config.ts` with) is recent enough to expose the `loadConfig({cwd, pkgPath})` API.
 */
export function validatePkgUtilsVersion({basePath}: {basePath: string}): string[] {
  const require = createRequire(path.join(basePath, 'package.json'))

  let installedVersion: string | undefined
  try {
    const pkgUtilsManifest = require('@sanity/pkg-utils/package.json') as {version?: string}
    installedVersion = pkgUtilsManifest.version
  } catch {
    return [
      outdent`
        @sanity/pkg-utils is not installed.
        plugin-kit loads package.config.ts through @sanity/pkg-utils (a peer dependency).

        Please install it by running 'npm install --save-dev @sanity/pkg-utils'.
    `.trimStart(),
    ]
  }

  const major = Number.parseInt(installedVersion?.split('.')[0] ?? '', 10)
  if (!Number.isFinite(major) || major < minPkgUtilsMajor) {
    return [
      outdent`
        @sanity/pkg-utils ${installedVersion} is too old.
        plugin-kit requires @sanity/pkg-utils >=${minPkgUtilsMajor} to load package.config.ts.

        Please upgrade it by running 'npm install --save-dev @sanity/pkg-utils@latest'.
    `.trimStart(),
    ]
  }

  return []
}

export function validateSanityDependencies(packageJson: PackageJson): string[] {
  const {dependencies, devDependencies, peerDependencies} = packageJson
  const allDependencies = {...dependencies, ...devDependencies, ...peerDependencies}

  const illegalDeps = Object.keys(allDependencies).filter((dep) => mergedPackages.includes(dep))
  const deps = new Set<string>(illegalDeps)
  const unique = [...deps.values()]
  if (unique.length) {
    return [
      outdent`
        package.json depends on "@sanity/*" packages that have moved into "sanity" package.

        The following dependencies should be replaced with "sanity":
        - ${unique.join('\n- ')}

        Refer to the reference docs to find replacement imports:
        ${urls.refDocs}
    `.trimStart(),
    ]
  }
  return []
}

export function validateDeprecatedDependencies(packageJson: PackageJson): string[] {
  const {dependencies, devDependencies, peerDependencies} = packageJson
  const allDependencies = {...dependencies, ...devDependencies, ...peerDependencies}

  const illegalDeps = Object.keys(allDependencies).filter((dep) => deprecatedDevDeps.includes(dep))
  const deps = new Set<string>(illegalDeps)
  const unique = [...deps.values()]
  if (unique.length) {
    return [
      outdent`
        package.json contains deprecated dependencies that should be removed:
        - ${unique.join('\n- ')}
    `.trimStart(),
    ]
  }

  return []
}

export async function validateBabelConfig({basePath}: {basePath: string}) {
  const suffixes = ['json', 'js', 'cjs', 'mjs']
  const babelFileNames = ['.babelrc', 'babel.config']
  const filenames = ['.babelrc', ...filesWithSuffixes(babelFileNames, suffixes)]

  const babelFiles: string[] = []
  for (const filename of filenames) {
    const filepath = path.normalize(path.join(basePath, filename))
    if (await fileExists(filepath)) {
      babelFiles.push(filename)
    }
  }

  if (babelFiles.length) {
    return [
      outdent`
        Found babel-config file: [${babelFiles.join(
          ', ',
        )}]. When using default @sanity/plugin-kit build command,
        this is probably not needed.

        Delete the file, or disable this check.
      `.trimStart(),
    ]
  }
  return []
}

export async function validateStudioConfig({basePath}: {basePath: string}): Promise<string[]> {
  const suffixes = ['ts', 'js', 'tsx', 'jsx']

  const filenames = filesWithSuffixes(['sanity.config', 'sanity.cli'], suffixes)

  const files: Record<string, boolean | undefined> = {}

  for (const filename of filenames) {
    const filepath = path.normalize(path.join(basePath, filename))
    files[filename] = await fileExists(filepath)
  }

  const sanityJson = await readJson5File<SanityStudioJson>({basePath, filename: 'sanity.json'})

  const hasConfigFile = (fileBase: string) =>
    filesWithSuffixes([fileBase], suffixes).some((filename) => files[filename])
  const hasCliConfig = hasConfigFile('sanity.cli')
  const hasStudioConfig = hasConfigFile('sanity.config')

  const errors: string[] = []

  if (sanityJson) {
    const info = [
      outdent`
        Found sanity.json. This file is not used by Sanity Studio V3.

        Please consult the Studio V3 migration guide:
         ${urls.migrationGuideStudio}
        It will detail how to convert sanity.json to sanity.config.ts (or .js) and sanity.cli.ts (or .js) equivalents.
      `.trimStart(),
      sanityJson.plugins?.length &&
        outdent`
        For V3 versions and alternatives to V2 plugins, please refer to the Sanity Exchange:
        ${urls.sanityExchange}
      `.trimStart(),
    ].filter((s): s is string => !!s)

    errors.push(info.join('\n\n'))
  }

  if (!hasCliConfig) {
    errors.push(
      outdent`
        sanity.cli.(${suffixes.join(
          ' | ',
        )}) missing. Please create a file named sanity.cli.ts with the following content:

        ${chalk.green(
          outdent`
        import {createCliConfig} from 'sanity/cli'

        export default createCliConfig({
          api: {
            projectId: '${sanityJson?.api?.projectId ?? 'project-id'}',
            dataset: '${sanityJson?.api?.dataset ?? 'dataset'}',
          }
        })`,
        )}

        Make sure to replace the projectId and dataset fields with your own.

        For more, see ${urls.migrationGuideStudio}
    `.trimStart(),
    )
  }

  if (!hasStudioConfig) {
    errors.push(
      outdent`
        sanity.config.(${suffixes.join(
          ' | ',
        )}) missing. At a minimum sanity.config.ts should contain:

        ${chalk
          .green(
            outdent`
            import { defineConfig } from "sanity"
            import { deskTool } from "sanity/desk"

            export default defineConfig({
              name: "default",

              projectId: '${sanityJson?.api?.projectId ?? 'project-id'}',
              dataset: '${sanityJson?.api?.dataset ?? 'dataset'}',

              plugins: [
                deskTool(),
              ],

              schema: {
                types: [
                  /* put your v2 schema-types here */
                ],
              },
            })`,
          )
          .trimStart()}

        Make sure to replace the projectId and dataset fields with your own.

        For more, see ${urls.migrationGuideStudio}
    `.trimStart(),
    )
  }

  return errors.length ? [errors.join(`\n\n---\n\n`)] : []
}

/**
 * Detects leftover usage of the legacy `@sanity/incompatible-plugin` shim and asks for its removal.
 *
 * The shim (a `sanity.json` + `v2-incompatible.js` entry point, plus the `@sanity/incompatible-plugin`
 * dependency) only rendered an error dialog in the long end-of-life Sanity Studio v2 when a v3 plugin
 * was installed there. plugin-kit no longer scaffolds it, so a plugin should not ship it anymore.
 */
export async function validateIncompatiblePlugin({
  basePath,
  packageJson,
}: {
  basePath: string
  packageJson: PackageJson
}): Promise<string[]> {
  const {dependencies, devDependencies, peerDependencies} = packageJson
  const inDependencies = !!(
    dependencies?.[incompatiblePluginPackage] ||
    devDependencies?.[incompatiblePluginPackage] ||
    peerDependencies?.[incompatiblePluginPackage]
  )

  const hasShimFile = await fileExists(path.normalize(path.join(basePath, 'v2-incompatible.js')))

  const sanityJson = await readJson5File<SanityV2Json>({basePath, filename: 'sanity.json'})
  const sanityJsonReferencesShim = !!sanityJson?.parts?.some((part) =>
    part?.path?.includes('v2-incompatible'),
  )

  if (!inDependencies && !hasShimFile && !sanityJsonReferencesShim) {
    return []
  }

  const found = [
    inDependencies ? `- "${incompatiblePluginPackage}" listed in package.json` : null,
    hasShimFile ? '- the v2-incompatible.js file' : null,
    sanityJsonReferencesShim ? '- a sanity.json referencing v2-incompatible.js' : null,
  ].filter((e): e is string => !!e)

  return [
    outdent`
      ${incompatiblePluginPackage} is no longer used and should be removed.

      It only rendered an error dialog in the long end-of-life Sanity Studio v2 when a v3 plugin was
      installed there. That compatibility shim is now obsolete, so plugin-kit no longer adds it.

      Found:
      ${found.join('\n')}

      To fix this:
      - Remove "${incompatiblePluginPackage}" from package.json (dependencies/devDependencies/peerDependencies)
      - Delete the v2-incompatible.js file
      - Delete sanity.json (if it only contains the v2-incompatible "part")
      - Remove "sanity.json" and "v2-incompatible.js" from the package.json "files" array

      For more, see ${urls.incompatiblePlugin}
    `.trimStart(),
  ]
}

export function validatePackageName(packageJson: PackageJson) {
  const valid = validateNpmPackageName(packageJson.name ?? '')
  if (!valid.validForNewPackages) {
    const messages = valid.errors ?? valid.warnings ?? []
    return [`Invalid package.json: "name" is invalid: ${messages.join(', ')}`]
  }

  const isScoped = packageJson.name?.startsWith('@')
  if (!isScoped && !packageJson.name?.startsWith('sanity-plugin-')) {
    return [
      `Invalid package.json: "name" should be prefixed with "sanity-plugin-" (or scoped - @your-company/plugin-name)`,
    ]
  }
  return []
}

/**
 * Plugins built with @sanity/plugin-kit publish the compiled output (the `dist` directory) plus any
 * v2-compatibility files. The `src` directory should not be published: it bloats the package and can
 * cause bundlers that resolve the `source` export condition to pull in raw, uncompiled TypeScript.
 */
export function validateBannedFiles(packageJson: PackageJson): string[] {
  const {files} = packageJson
  if (!Array.isArray(files)) {
    return []
  }

  const hasSrc = files.some((entry) => {
    if (typeof entry !== 'string') {
      return false
    }
    // Normalize entries like "./src", "src/", "/src" before comparing.
    const normalized = entry
      .trim()
      .replace(/^\.?\/+/, '')
      .replace(/\/+$/, '')
    return normalized === 'src'
  })

  if (!hasSrc) {
    return []
  }

  return [
    outdent`
      package.json "files" must not include "src".

      Plugins built with @sanity/plugin-kit publish the compiled output in "dist" (and any v2-compatibility files).
      Shipping the "src" directory bloats the published package and can cause bundlers that resolve the
      "source" export condition to import raw, uncompiled TypeScript.

      Please remove "src" from the "files" array in package.json.
    `.trimStart(),
  ]
}

export async function validateSrcIndexFile(basePath: string) {
  const paths = ['index.js', 'index.ts'].map((p) => path.join('src', p))
  const allowedIndexFiles = paths.map((file) => path.join(basePath, file))

  let hasIndex = false
  for (const indexFile of allowedIndexFiles) {
    hasIndex = hasIndex || (await fileExists(indexFile))
  }
  if (!hasIndex) {
    return [
      outdent`
      Expected one of [${paths.join(', ')}] to exist.

      @sanity/pkg-utils expects a non-jsx file to be the source entry-point for the plugin.
      If you currently have JSX in your index file, extract it into a separate file and import it.
      `,
    ]
  }

  return []
}

async function disallowDuplicateConfig({
  basePath,
  pkgJson,
  configKey,
  files,
}: {
  basePath: string
  pkgJson: PackageJson
  configKey: string
  files: string[]
}) {
  const found: string[] = []
  for (const file of files) {
    const filePath = path.join(basePath, file)
    const exits = await fileExists(filePath)
    if (exits) {
      found.push(file)
    }
  }
  if (found.length > 1) {
    return [
      outdent`
      Found multiple config files that serve the same purpose: [${found.join(', ')}].

      There should be at most one of these files. Delete the rest.
      `,
    ]
  }
  if (found.length && pkgJson[configKey]) {
    return [
      outdent`
      package.json contains ${configKey}, but there also exists a config file that serves the same purpose.
      Config file: ${found.join('')}]

      Either delete the file or remove ${configKey} entry from package.json.
      `,
    ]
  }

  return []
}

export async function disallowDuplicateEslintConfig(basePath: string, pkgJson: PackageJson) {
  return disallowDuplicateConfig({
    basePath,
    pkgJson,
    configKey: 'eslint',
    files: [
      '.eslintrc',
      '.eslintrc.js',
      '.eslintrc.cjs',
      '.eslintrc.yaml',
      '.eslintrc.yml',
      '.eslintrc.json',
    ],
  })
}

export async function disallowDuplicatePrettierConfig(basePath: string, pkgJson: PackageJson) {
  return disallowDuplicateConfig({
    basePath,
    pkgJson,
    configKey: 'prettier',
    files: [
      '.prettierrc',
      '.prettierrc.json5',
      '.prettierrc.json',
      '.prettierrc.yaml',
      '.prettierrc.yml',
      '.prettierrc.js',
      '.prettierrc.cjs',
      '.prettier.config,js',
      '.prettier.config.cjs',
      '.prettierrc.toml',
    ],
  })
}

import fs from 'fs'
import path from 'path'
import util from 'util'

import validateNpmPackageName from 'validate-npm-package-name'

import type {InjectOptions, PackageData} from '../actions/inject'
import type {PackageJson, SanityPlugin} from '../actions/verify/types'
import {expectedScripts} from '../actions/verify/validations'
import {
  forcedDevPackageVersions,
  forcedPackageVersions,
  forcedPeerPackageVersions,
} from '../configs/forced-package-versions'
import {cliName, requiredNodeEngine} from '../constants'
import {writeJsonFile} from '../util/files'
import {githubUrlToObject} from '../util/github-url'
import log from '../util/log'
import {resolveLatestVersions} from './resolveLatestVersions'

export interface GetPackageOptions {
  basePath: string
  validate?: boolean
  isPlugin?: boolean
}

const defaultDependencies: string[] = []

const defaultDevDependencies = [
  'sanity',

  // peer dependencies of `sanity`
  'react',
  'react-dom',
  'styled-components',
]

const defaultPeerDependencies = ['react', 'sanity']

const readFile = util.promisify(fs.readFile)

export async function getPackage(opts: GetPackageOptions): Promise<PackageJson> {
  validateOptions(opts)

  const {basePath, validate = true} = opts
  const manifestPath = path.normalize(path.join(basePath, 'package.json'))

  let content
  try {
    content = await readFile(manifestPath, 'utf8')
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw new Error(
        `No package.json found. package.json is required to publish to npm. Use \`${cliName} init\` for a new plugin, or \`npm init\` for an existing one`,
      )
    }

    throw new Error(`Failed to read "${manifestPath}": ${err.message}`)
  }

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (err: any) {
    throw new Error(`Error parsing "${manifestPath}": ${err.message}`)
  }

  if (!isObject(parsed)) {
    throw new Error(`Invalid package.json: Root must be an object`)
  }

  if (validate) {
    validatePackage(parsed, opts)
  }

  return parsed
}

function validatePackage(manifest: PackageJson, opts: GetPackageOptions) {
  validateOptions(opts)

  const options = {isPlugin: true, ...opts}

  if (options.isPlugin) {
    validatePackageName(manifest)
  }

  validateLockFiles(options)
}

function validateOptions(opts: {basePath: string}) {
  const options = opts || {}
  if (!isObject(options)) {
    throw new Error(`Options must be an object`)
  }

  if (typeof options.basePath !== 'string') {
    throw new Error(`"options.basePath" must be a string (path to plugin base path)`)
  }
}

function validatePackageName(manifest: PackageJson) {
  if (typeof manifest.name !== 'string') {
    throw new Error(`Invalid package.json: "name" must be a string`)
  }

  const valid = validateNpmPackageName(manifest.name)
  if (!valid.validForNewPackages) {
    throw new Error(`Invalid package.json: "name" is invalid: ${(valid.errors ?? []).join(', ')}`)
  }

  const isScoped = manifest.name[0] === '@'
  if (!isScoped && !manifest.name.startsWith('sanity-plugin-')) {
    throw new Error(
      `Invalid package.json: "name" should be prefixed with "sanity-plugin-" (or scoped - @your-company/plugin-name)`,
    )
  }
}

function isObject(obj: unknown): obj is Record<string, unknown> {
  return !Array.isArray(obj) && obj !== null && typeof obj === 'object'
}

function validateLockFiles(options: {basePath: string}) {
  const npm = fs.existsSync(path.join(options.basePath, 'package-lock.json'))
  const yarn = fs.existsSync(path.join(options.basePath, 'yarn.lock'))
  if (npm && yarn) {
    throw new Error(`Invalid plugin: contains both package-lock.json and yarn.lock`)
  }
}

export async function writePackageJson(data: PackageData, options: InjectOptions) {
  const {user, pluginName, license, description, pkg: prevPkg, gitOrigin} = data
  const {
    outDir,
    peerDependencies: addPeers,
    dependencies: addDeps,
    devDependencies: addDevDeps,
  } = options
  const {flags} = options
  const prev = prevPkg || {}

  const useOxfmt = flags.oxfmt !== false
  const useOxlint = flags.oxlint !== false
  const useTypescript = flags.typescript !== false

  const newDevDependencies = [cliName, '@sanity/pkg-utils']

  if (useTypescript) {
    log.debug('Using TypeScript. Adding to dev dependencies.')
    newDevDependencies.push('@types/react', 'typescript')
  }

  if (useOxfmt) {
    log.debug('Using oxfmt. Adding to dev dependencies.')
    newDevDependencies.push('oxfmt')
  }

  if (useOxlint) {
    log.debug('Using oxlint. Adding to dev dependencies.')
    // oxlint-tsgolint powers the type-aware rules and type checking enabled in the shared config
    newDevDependencies.push('oxlint', 'oxlint-tsgolint')
  }

  log.debug('Resolving latest versions for %s', newDevDependencies.join(', '))
  const dependencies = forceDependencyVersions(
    {
      ...(prev.dependencies || {}),
      ...(addDeps || {}),
      ...(await resolveLatestVersions(defaultDependencies)),
    },
    forcedPackageVersions,
  )
  const devDependencies = forceDependencyVersions(
    {
      ...(addDevDeps || {}),
      ...(prev.devDependencies || {}),
      ...(await resolveLatestVersions([...newDevDependencies, ...defaultDevDependencies])),
    },
    forcedDevPackageVersions,
  )
  const peerDependencies = forceDependencyVersions(
    {
      ...(prev.peerDependencies || {}),
      ...(addPeers || {}),
      ...(await resolveLatestVersions(defaultPeerDependencies)),
    },
    forcedPeerPackageVersions,
  )

  const source = flags.typescript ? './src/index.ts' : './src/index.js'

  const files = [outDir]

  // sort alphabetically for scanability
  files.sort()

  // Opting out of oxfmt/oxlint must also disable the corresponding verify-package checks,
  // otherwise the scaffolded `build` script (which runs verify-package) fails out of the box
  const verifyPackageOptOuts = {
    ...(useOxfmt ? {} : {oxfmt: false}),
    ...(useOxlint ? {} : {oxlint: false}),
  }
  const prevSanityPlugin: SanityPlugin = prev.sanityPlugin ?? {}
  const sanityPlugin: SanityPlugin | undefined = Object.keys(verifyPackageOptOuts).length
    ? {
        ...prevSanityPlugin,
        verifyPackage: {...prevSanityPlugin.verifyPackage, ...verifyPackageOptOuts},
      }
    : prev.sanityPlugin

  // order should be compatible with oxfmt's sortPackageJson
  const forcedOrder = {
    name: pluginName,
    version: prev.version ?? '1.0.0',
    description: description || '',
    keywords: prev.keywords ?? ['sanity', 'sanity-plugin'],
    ...urlsFromOrigin(gitOrigin),
    ...repoFromOrigin(gitOrigin),
    license: license ? license.id : 'UNLICENSED',
    author: user?.email ? `${user.name} <${user.email}>` : user?.name,
    sideEffects: false,
    type: 'module',
    exports: {
      '.': {
        source,
        default: `./${outDir}/index.js`,
      },
      './package.json': './package.json',
    },
    ...(flags.typescript ? {types: `./${outDir}/index.d.ts`} : {}),
    files,
    scripts: {...prev.scripts},
    dependencies: sortKeys(dependencies),
    devDependencies: sortKeys(devDependencies),
    peerDependencies: sortKeys(peerDependencies),
    engines: {
      node: requiredNodeEngine,
    },
    ...(sanityPlugin ? {sanityPlugin} : {}),
  }

  const manifest: PackageJson = {
    ...forcedOrder,
    // Use already configured values by default (if not otherwise specified)
    ...(prev || {}),
    // We're de-declaring properties because of key order in package.json
    ...forcedOrder,
  }

  const differs = JSON.stringify(prev) !== JSON.stringify(manifest)
  log.debug('Does manifest differ? %s', differs ? 'yes' : 'no')
  if (differs) {
    await writePackageJsonDirect(manifest, options)
  }

  return differs ? manifest : prev
}

function urlsFromOrigin(gitOrigin?: string): {bugs?: {url: string}; homepage?: string} {
  if (!gitOrigin) {
    return {}
  }

  const details = githubUrlToObject(gitOrigin)
  if (!details) {
    return {}
  }

  return {
    homepage: `https://github.com/${details.user}/${details.repo}#readme`,
    bugs: {
      url: `https://github.com/${details.user}/${details.repo}/issues`,
    },
  }
}

function repoFromOrigin(gitOrigin?: string) {
  if (!gitOrigin) {
    return {}
  }

  return {
    repository: {
      type: 'git',
      url: gitOrigin,
    },
  }
}

export function addScript(cmd: string, existing: string) {
  if (existing && existing.includes(cmd)) {
    return existing
  }

  return cmd
}

export async function addPackageJsonScripts(
  manifest: PackageJson,
  options: InjectOptions,
  updateScripts: (currentScripts: Record<string, string>) => Record<string, string>,
) {
  const originalScripts = manifest.scripts || {}
  const scripts = updateScripts({...originalScripts})

  const differs = Object.keys(scripts).some((key) => scripts[key] !== originalScripts[key])

  if (differs) {
    await writePackageJsonDirect({...manifest, scripts}, options)
  }

  return differs
}

export async function writePackageJsonDirect(manifest: PackageJson, {basePath}: InjectOptions) {
  await writeJsonFile(path.join(basePath, 'package.json'), manifest)
}

export async function addBuildScripts(manifest: PackageJson, options: InjectOptions) {
  if (!options.flags.scripts) {
    return false
  }
  return addPackageJsonScripts(manifest, options, (scripts) => {
    scripts.build = addScript(expectedScripts.build, scripts.build)
    if (options.flags.oxfmt !== false) {
      scripts.format = addScript(`oxfmt`, scripts.format)
    }
    scripts['link-watch'] = addScript(expectedScripts['link-watch'], scripts['link-watch'])
    if (options.flags.oxlint !== false) {
      scripts.lint = addScript(`oxlint`, scripts.lint)
    }
    scripts.prepublishOnly = addScript(expectedScripts.prepublishOnly, scripts.prepublishOnly)
    scripts.watch = addScript(expectedScripts.watch, scripts.watch)
    return scripts
  })
}

export function sortKeys<T extends Record<string, unknown>>(unordered: T): T {
  return Object.keys(unordered)
    .sort()
    .reduce((obj, key) => {
      // @ts-expect-error this WILL work
      obj[key] = unordered[key]
      return obj
    }, {} as T)
}

/** @internal */
export function forceDependencyVersions(
  deps: Record<string, string>,
  versions = forcedPackageVersions,
): Record<string, string> {
  const entries = Object.entries(deps).map((entry) => {
    const [pkg] = entry
    const forceVersion = versions[pkg as keyof typeof versions]
    if (forceVersion) {
      return [pkg, forceVersion]
    }
    return entry
  })
  return Object.fromEntries(entries)
}

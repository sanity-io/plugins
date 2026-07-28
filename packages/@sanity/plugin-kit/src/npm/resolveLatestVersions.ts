import {getLatestVersion} from 'get-latest-version'

// We may want to lock certain dependencies to specific versions
const lockedDependencies: Record<string, string> = {
  'styled-components': '^6.1',
  'eslint': '^8.57.0',
  // The scaffolded ESLint toolchain (@typescript-eslint v8) requires the classic JS compiler API,
  // which TypeScript 7 (the Go-native compiler) no longer ships. Unlock once typescript-eslint
  // supports TypeScript 7.
  'typescript': '^6',
}

export async function resolveLatestVersions(packages: string[]) {
  const versions: Record<string, string> = {}
  for (const pkgName of packages) {
    versions[pkgName] = pkgName in lockedDependencies ? lockedDependencies[pkgName] : 'latest'
  }

  const entries = await Promise.all(
    Object.entries(versions).map(async ([pkgName, range]) => {
      const version = await getLatestVersion(pkgName, {range})
      if (!version) {
        throw new Error(`Found no version for ${pkgName}`)
      }
      return [pkgName, rangeify(version)] as const
    }),
  )

  return Object.fromEntries(entries)
}

function rangeify(version: string) {
  return `^${version}`
}

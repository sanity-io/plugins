export const cliName = '@sanity/plugin-kit'

export const urls = {
  refDocs: 'https://www.sanity.io/docs/reference',
  pluginReadme: 'https://github.com/sanity-io/plugins/tree/main/packages/@sanity/plugin-kit#readme',
}

export const defaultOutDir = 'dist'

/**
 * Minimum major version of `@sanity/pkg-utils` required in userland.
 *
 * plugin-kit loads `package.config.ts` via the plugin's own `@sanity/pkg-utils` (a peer
 * dependency) using the `loadConfig({cwd, pkgPath})` signature introduced in v10. Older majors
 * expose an incompatible `loadConfig({cwd})` and cannot reliably load ESM TypeScript configs.
 */
export const minPkgUtilsMajor = 10

/**
 * Required `engines.node` range for plugins, matching `@sanity/pkg-utils` so plugins declare the
 * same Node.js support as the build tool they use.
 */
export const requiredNodeEngine = '>=20.19 <22 || >=22.12'

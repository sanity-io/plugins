export const cliName = '@sanity/plugin-kit'

export const urls = {
  refDocs: 'https://beta.sanity.io/docs/reference',
  migrationGuideStudio: 'https://beta.sanity.io/docs/platform/v2-to-v3',
  migrationGuidePlugin: 'https://beta.sanity.io/docs/platform/v2-to-v3/plugins',
  pluginReadme: 'https://github.com/sanity-io/plugin-kit',
  incompatiblePlugin: 'https://github.com/sanity-io/incompatible-plugin',
  sanityExchange: 'https://www.sanity.io/exchange',
  linterPackage: 'https://github.com/sanity-io/eslint-config-no-v2-imports',
}

export const incompatiblePluginPackage = '@sanity/incompatible-plugin'

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
 * Required `engines.node` range for plugins, matching `sanity` so plugins declare the same Node.js
 * support as the Studio they integrate with.
 *
 * Plugins support a range of `sanity` majors (`^5 || ^6`), so this tracks the lowest supported
 * major — currently `sanity` v5 — to stay installable wherever a supported Studio runs. When v5
 * support is dropped, bump this to v6's range (`>=22.12`).
 */
export const requiredNodeEngine = '>=20.19 <22 || >=22.12'

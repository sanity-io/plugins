import {fileURLToPath} from 'node:url'

import type {Config} from 'stylelint'

/** Where this package's copy of a config lives: `stylelint-config-recommended` is ESM-only */
const resolve = (specifier: string): string => fileURLToPath(import.meta.resolve(specifier))

/**
 * Shared [stylelint](https://stylelint.io) preset for Sanity plugins - the same settings the
 * [sanity-io/plugins](https://github.com/sanity-io/plugins) monorepo uses:
 * [`stylelint-config-recommended`](https://github.com/stylelint/stylelint-config-recommended),
 * which catches what the browser would drop silently (unknown properties and values, invalid
 * selectors, duplicate declarations) on top of the parse errors every run reports, plus
 * [`stylelint-config-css-modules`](https://github.com/pascalduez/stylelint-config-css-modules)
 * for the CSS modules syntax (`:global()`, `:local()`, `composes`, `@value`) the recommended
 * rules would otherwise flag. Both configs are this package's dependencies, resolved here, so the
 * preset works wherever it is loaded from.
 *
 * Import it from a `stylelint.config.mjs` next to the `package.json` that installs and runs
 * `stylelint` (the repository root in a monorepo, otherwise the plugin directory):
 *
 * ```js
 * export {default} from '@sanity/plugin-kit/stylelint'
 * ```
 *
 * To customize, spread the preset and add your own options:
 *
 * ```js
 * import pluginKitStylelint from '@sanity/plugin-kit/stylelint'
 *
 * export default {
 *   ...pluginKitStylelint,
 *   ignoreFiles: [...(pluginKitStylelint.ignoreFiles ?? []), 'storybook-static/**'],
 * }
 * ```
 *
 * The config file is `.mjs` rather than `.ts` on purpose: stylelint loads TypeScript configs
 * through the TypeScript compiler API, which TypeScript 7 no longer ships.
 *
 * @public
 */
const config = {
  extends: [resolve('stylelint-config-recommended'), resolve('stylelint-config-css-modules')],
  rules: {
    // The one formatting rule the CSS modules config brings along; blank lines are oxfmt's job
    'at-rule-empty-line-before': null,
  },
  // `satisfies` keeps `ignoreFiles` an array for configs that spread it (`Config` allows a string)
  ignoreFiles: ['**/dist/**'],
} satisfies Config

export default config

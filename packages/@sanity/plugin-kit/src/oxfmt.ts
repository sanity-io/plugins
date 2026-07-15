import type {OxfmtConfig} from 'oxfmt'

/**
 * Shared [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) preset for Sanity plugins - the
 * same settings the [sanity-io/plugins](https://github.com/sanity-io/plugins) monorepo uses.
 *
 * Re-export it from an `oxfmt.config.ts` next to the `package.json` that runs oxfmt (the
 * repository root in a monorepo, otherwise the plugin directory):
 *
 * ```ts
 * export {default} from '@sanity/plugin-kit/oxfmt'
 * ```
 *
 * Oxfmt has no `extends` mechanism; to customize, spread the preset and override options:
 *
 * ```ts
 * import pluginKitOxfmt from '@sanity/plugin-kit/oxfmt'
 * import {defineConfig} from 'oxfmt'
 *
 * export default defineConfig({
 *   ...pluginKitOxfmt,
 *   ignorePatterns: [...(pluginKitOxfmt.ignorePatterns ?? []), 'CHANGELOG.md'],
 * })
 * ```
 *
 * @public
 */
const config: OxfmtConfig = {
  printWidth: 100,
  semi: false,
  singleQuote: true,
  bracketSpacing: false,
  quoteProps: 'consistent',
  sortImports: true,
  sortPackageJson: {sortScripts: true},
  ignorePatterns: ['dist/**', 'pnpm-lock.yaml', 'turbo/**/*.hbs'],
  overrides: [
    {
      files: ['.changeset/*.md'],
      options: {singleQuote: false},
    },
  ],
}

export default config

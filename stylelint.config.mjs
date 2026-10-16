import pluginKitStylelint from '@sanity/plugin-kit/stylelint'

// Shared Sanity plugin stylelint rules live in the @sanity/plugin-kit preset; only
// workspace-specific ignores belong here. `.mjs` rather than `.ts` on purpose: stylelint loads
// TypeScript configs through the TypeScript compiler API, which TypeScript 7 does not ship.
/** @type {import('stylelint').Config} */
export default {
  ...pluginKitStylelint,
  ignoreFiles: [...(pluginKitStylelint.ignoreFiles ?? []), '**/storybook-static/**'],
}

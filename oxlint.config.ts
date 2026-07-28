import sanityPluginKitOxlint from '@sanity/plugin-kit/oxlint'
import {defineConfig} from 'oxlint'

// Shared Sanity plugin rules (plugins, options, categories, rules) live in the
// @sanity/plugin-kit config; only workspace-specific ignores and overrides belong here.
// Prefer inline `oxlint-disable` suppressions over package-wide overrides for plugin source.
export default defineConfig({
  extends: [sanityPluginKitOxlint],
  ignorePatterns: [
    // ignorePatterns do not propagate through extends, so spread the shared ones
    ...(sanityPluginKitOxlint.ignorePatterns ?? []),
    'turbo/generators/config.ts',
    // Illustrative docs referencing optional third-party form libraries
    // (formik, react-hook-form, @tanstack/react-form, zod); not built or published
    'plugins/@sanity/form-toolkit/examples/**',
    'packages/@sanity/plugin-kit/assets/**',
    'packages/@sanity/plugin-kit/test/fixtures/**',
  ],
  overrides: [
    {
      files: ['e2e/**/*.ts'],
      rules: {
        'no-console': 'off',
        // Setup/cleanup scripts paginate GitHub and delete datasets sequentially.
        'no-await-in-loop': 'off',
        'no-unsafe-type-assertion': 'off',
      },
    },
    {
      files: ['turbo/generators/**/*.ts'],
      rules: {
        'no-console': 'off',
        'no-unsafe-type-assertion': 'off',
      },
    },
  ],
})

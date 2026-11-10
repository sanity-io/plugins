import sanityPluginKitOxlint from '@sanity/plugin-kit/oxlint'
import {defineConfig} from 'oxlint'

// Shared Sanity plugin rules (plugins, options, categories, rules) live in the
// @sanity/plugin-kit config; only workspace-specific ignores and overrides belong here.
// Prefer inline `oxlint-disable` suppressions over package-wide overrides for plugin source.
export default defineConfig({
  extends: [sanityPluginKitOxlint],
  // ESLint plugins loaded through oxlint's JS plugins support. Rules from these
  // plugins are enabled per-file-pattern in `overrides`.
  jsPlugins: ['eslint-plugin-storybook'],
  ignorePatterns: [
    // ignorePatterns do not propagate through extends, so spread the shared ones
    ...(sanityPluginKitOxlint.ignorePatterns ?? []),
    '**/storybook-static/*',
    'turbo/generators/config.ts',
    // Illustrative docs referencing optional third-party form libraries
    // (formik, react-hook-form, @tanstack/react-form, zod); not built or published
    'plugins/@sanity/form-toolkit/examples/**',
    'packages/@sanity/plugin-kit/assets/**',
    'packages/@sanity/plugin-kit/test/fixtures/**',
    // AILF reference solutions - graded artefacts, not part of the plugins build
    'plugins/**/.ailf/tasks/**/*.reference.ts',
    // The CSS module typings css-modules-kit writes (`pnpm css:types`): gitignored, `@ts-nocheck`ed
    // declarations the type checker still reads through `rootDirs`
    '**/generated/**/*.module.css.d.ts',
  ],
  rules: {
    // This monorepo builds plugins with React Compiler, so unlike the plugin-kit preset
    // (which mostly relies on category defaults) every React Compiler rule is enabled:
    // https://oxc.rs/blog/2026-08-18-react-compiler-support.html#oxlint
    'react/capitalized-calls': 'error',
    'react/exhaustive-effect-dependencies': 'error',
    'react/hooks': 'error',
    'react/invariant': 'error',
    'react/memo-dependencies': 'error',
    'react/no-deriving-state-in-effects': 'error',
    'react/rule-suppression': 'error',
    'react/syntax': 'error',
    'react/todo': 'error',
    'react/unsupported-syntax': 'error',
    'react/void-use-memo': 'error',
  },
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
    {
      // The CSF rule set from eslint-plugin-storybook's flat/recommended config,
      // scoped to the same story file patterns (warn-level rules bumped to error
      // to match the rest of this config, which also runs with denyWarnings).
      files: ['**/*.stories.{js,jsx,mjs,cjs,ts,tsx}', '**/*.story.{js,jsx,mjs,cjs,ts,tsx}'],
      rules: {
        'storybook/await-interactions': 'error',
        'storybook/context-in-play-function': 'error',
        'storybook/default-exports': 'error',
        'storybook/hierarchy-separator': 'error',
        'storybook/no-redundant-story-name': 'error',
        'storybook/no-renderer-packages': 'error',
        'storybook/prefer-pascal-case': 'error',
        'storybook/story-exports': 'error',
        'storybook/use-storybook-expect': 'error',
        'storybook/use-storybook-testing-library': 'error',
      },
    },
    {
      // no-uninstalled-addons resolves its packageJsonLocation option relative to
      // the working directory (the repo root when run via `pnpm lint`), so point
      // it at the storybook app's manifest where the addons are installed.
      files: ['**/.storybook/main.{js,cjs,mjs,ts}'],
      rules: {
        'storybook/no-uninstalled-addons': [
          'error',
          {packageJsonLocation: './dev/storybook/package.json'},
        ],
      },
    },
  ],
})

import sanityPluginKitOxlint from '@sanity/plugin-kit/oxlint'
import {defineConfig} from 'oxlint'

// Shared Sanity plugin rules (plugins, options, categories, rules) live in the
// @sanity/plugin-kit config; only workspace-specific ignores and overrides belong here.
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
    // AILF reference solutions - graded artefacts, not part of the plugins build
    'plugins/**/.ailf/tasks/**/*.reference.ts',
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
    {
      files: ['plugins/sanity-naive-html-serializer/src/**/*.ts'],
      rules: {
        'no-unsafe-type-assertion': 'off',
        'restrict-template-expressions': 'off',
      },
    },
    {
      files: ['plugins/@sanity/embeddings-index-ui/src/**/*.{ts,tsx}'],
      rules: {
        'no-deprecated': 'off',
        'no-unsafe-type-assertion': 'off',
        'restrict-template-expressions': 'off',
        'promise/always-return': 'off',
      },
    },
    {
      files: ['plugins/sanity-plugin-mux-input/src/**/*.{ts,tsx}'],
      rules: {
        'no-deprecated': 'off',
        'no-unsafe-type-assertion': 'off',
        'restrict-template-expressions': 'off',
        'promise/always-return': 'off',
        'typescript/no-base-to-string': 'off',
        'typescript/no-useless-default-assignment': 'off',
        'typescript/no-redundant-type-constituents': 'off',
        'jsx-a11y/media-has-caption': 'off',
        'jsx-a11y/label-has-associated-control': 'off',
        'unicorn/prefer-add-event-listener': 'off',
        'no-restricted-imports': 'off',
        'no-await-in-loop': 'off',
        'typescript/consistent-return': 'off',
        'import/no-commonjs': 'off',
        'oxc/no-map-spread': 'off',
      },
    },
    {
      files: ['plugins/sanity-plugin-media/src/**/*.{ts,tsx}'],
      rules: {
        'no-deprecated': 'off',
        'no-unsafe-type-assertion': 'off',
        // zodFormResolver bridges a type-only zod v3/v4 mismatch whose inferred types depend on
        // dependency hoisting, so this assertion is only "unnecessary" for some install graphs
        'no-unnecessary-type-assertion': 'off',
        'restrict-template-expressions': 'off',
        'promise/always-return': 'off',
        'typescript/unbound-method': 'off',
        'typescript/no-redundant-type-constituents': 'off',
        'typescript/no-unnecessary-type-conversion': 'off',
        'import/no-commonjs': 'off',
        'jsx-a11y/control-has-associated-label': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'react/no-array-index-key': 'off',
        'jsx-a11y/media-has-caption': 'off',
        'oxc/no-map-spread': 'off',
        'unicorn/prefer-add-event-listener': 'off',
        'no-await-in-loop': 'off',
        'react/no-unstable-nested-components': 'off',
      },
    },
    {
      // Casting Sanity input props to the plugin's input component props is a known
      // pattern, as is asserting the gmp-place-autocomplete custom event type.
      files: ['plugins/@sanity/google-maps-input/src/**/*.{ts,tsx}'],
      rules: {
        'no-unsafe-type-assertion': 'off',
      },
    },
    {
      files: ['plugins/@sanity/personalization-plugin/src/**/*.{ts,tsx}'],
      rules: {
        'no-unsafe-type-assertion': 'off',
        'restrict-template-expressions': 'off',
        'no-base-to-string': 'off',
        'no-await-in-loop': 'off',
      },
    },
    {
      files: ['plugins/sanity-plugin-cloudinary/src/**/*.{ts,tsx}'],
      rules: {
        'no-unsafe-type-assertion': 'off',
      },
    },
    {
      files: ['plugins/sanity-naive-html-serializer/test/**/*.ts'],
      rules: {
        'no-unsafe-type-assertion': 'off',
        'restrict-template-expressions': 'off',
      },
    },
    {
      files: ['plugins/@sanity/hierarchical-document-list/src/**'],
      rules: {
        // Legacy code interfaces with the loosely-typed react-sortable-tree API
        'no-unsafe-type-assertion': 'off',
        // Scaffold blocks and split text segments are purely positional
        'react/no-array-index-key': 'off',
      },
    },
    {
      files: ['packages/@sanity/plugin-kit/**/*.ts'],
      rules: {
        // plugin-kit is a Node CLI tool ported from sanity-io/plugin-kit; console is its UI
        // and the legacy codebase predates these stylistic rules
        'no-await-in-loop': 'off',
        'no-console': 'off',
        'no-map-spread': 'off',
        'no-misused-spread': 'off',
        'no-named-as-default': 'off',
        'no-unnecessary-boolean-literal-compare': 'off',
        'no-unnecessary-template-expression': 'off',
        'no-unnecessary-type-parameters': 'off',
        'no-unsafe-type-assertion': 'off',
        'no-useless-fallback-in-spread': 'off',
        'prefer-set-has': 'off',
        'preserve-caught-error': 'off',
        'unbound-method': 'off',
      },
    },
    {
      // XState v5's canonical typing pattern relies on `{} as Context` style assertions,
      // which drive the machine's generic type inference and are never truly unnecessary
      files: ['plugins/sanity-plugin-dashboard-widget-vercel/src/machines/*.ts'],
      rules: {
        'no-unsafe-type-assertion': 'off',
        'no-unnecessary-type-assertion': 'off',
      },
    },
  ],
})

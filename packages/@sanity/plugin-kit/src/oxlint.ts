import type {OxlintConfig} from 'oxlint'

/**
 * Shared [oxlint](https://oxc.rs/docs/guide/usage/linter.html) config for Sanity plugins - the
 * same settings the [sanity-io/plugins](https://github.com/sanity-io/plugins) monorepo uses:
 * type-aware rules and TypeScript type checking enabled (via `oxlint-tsgolint`), warnings denied,
 * and the React, React Compiler, import, promise, a11y and unicorn rule sets turned on.
 *
 * Re-export it from an `oxlint.config.ts` next to the `package.json` that runs oxlint (the
 * repository root in a monorepo, otherwise the plugin directory):
 *
 * ```ts
 * export {default} from '@sanity/plugin-kit/oxlint'
 * ```
 *
 * To customize, extend it and add your own options ([`ignorePatterns` do not propagate through
 * `extends`](https://oxc.rs/docs/guide/usage/linter/config.html#extend-shared-configs), so spread
 * them explicitly when adding your own):
 *
 * ```ts
 * import sanityPluginKitOxlint from '@sanity/plugin-kit/oxlint'
 * import {defineConfig} from 'oxlint'
 *
 * export default defineConfig({
 *   extends: [sanityPluginKitOxlint],
 *   ignorePatterns: [...(sanityPluginKitOxlint.ignorePatterns ?? []), 'examples/**'],
 * })
 * ```
 *
 * Note: TypeScript config files require the Node-based `oxlint` package and Node `>=22.18`.
 *
 * @public
 */
const config: OxlintConfig = {
  plugins: ['typescript', 'unicorn', 'react', 'react-perf', 'oxc', 'import', 'jsx-a11y', 'promise'],
  ignorePatterns: ['**/.sanity/*', '**/dist/*', '**/sanity.types.ts'],
  options: {
    denyWarnings: true,
    reportUnusedDisableDirectives: 'error',
    typeAware: true,
    typeCheck: true,
  },
  categories: {
    correctness: 'error',
    suspicious: 'error',
    perf: 'error',
  },
  rules: {
    'no-underscore-dangle': 'off',
    'consistent-function-scoping': 'off',
    'eslint/no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'lodash-es',
            message:
              "Import from individual modules instead, e.g. `import debounce from 'lodash-es/debounce.js'`. Barrel imports are ~55% slower.",
          },
          {
            name: 'date-fns',
            message:
              "Import from individual modules instead, e.g. `import {startOfDay} from 'date-fns/startOfDay'`. Barrel imports are ~50% slower.",
          },
          {
            name: 'date-fns-tz',
            message:
              'Use the official `@date-fns/tz` package (TZDate, tz, tzOffset) with date-fns v4 instead, matching sanity core.',
          },
          {
            name: 'react',
            importNames: ['createElement'],
            message:
              'Please use JSX instead of createElement, for example `createElement(Icon)` should be `<Icon />`',
          },
          {
            name: 'react',
            importNames: ['forwardRef'],
            message:
              'forwardRef is unnecessary in React 19 — `ref` is a regular prop. Accept `ref` in your component props instead, e.g. `function Foo({ref, ...props}: Props & {ref?: Ref<T>}) {}`. See the sanity-plugin-best-practices skill.',
          },
        ],
        patterns: [
          {
            group: ['lodash.*', 'lodash/*', 'lodash'],
            message:
              "Please use individual imports from 'lodash-es' instead, e.g. `import debounce from 'lodash-es/debounce.js'`.",
          },
        ],
      },
    ],

    // React Compiler checks
    'react/react-compiler': 'error',

    'typescript/ban-ts-comment': 'error',
    'typescript/no-deprecated': 'error',
    'typescript/no-unnecessary-type-assertion': 'error',
    'typescript/no-unnecessary-type-arguments': 'error',
    'typescript/prefer-ts-expect-error': 'error',
    'import/no-commonjs': 'error',
    'import/no-unassigned-import': ['error', {allow: ['**/*.css']}],
    'no-restricted-globals': [
      'error',
      {name: '__dirname', message: 'Use path.dirname(fileURLToPath(import.meta.url)) instead'},
      {name: '__filename', message: 'Use fileURLToPath(import.meta.url) instead'},
    ],
    'react/jsx-key': 'error',
    'unicorn/no-abusive-eslint-disable': 'error',
    // Not relevant as we use the modern jsx-runtime transform
    'react-in-jsx-scope': 'off',
    // Not relevant due to React Compiler
    'react_perf/jsx-no-new-array-as-prop': 'off',
    'react_perf/jsx-no-new-object-as-prop': 'off',
    'react_perf/jsx-no-new-function-as-prop': 'off',
    'react_perf/jsx-no-jsx-as-prop': 'off',
    // False negatives
    'jsx_a11y/anchor-is-valid': 'off',
    'jsx_a11y/no-autofocus': 'off',
    // Handy rules that are disabled by default
    'react/exhaustive-deps': 'error',
    'react/rules-of-hooks': 'error',
    'eslint/no-console': ['error', {allow: ['warn', 'error']}],
    // Requires polyfills for older browsers
    'no-array-reverse': 'off',
    'no-array-sort': 'off',
    // Too noisy, common in callbacks/closures
    'no-shadow': 'off',
  },
}

export default config

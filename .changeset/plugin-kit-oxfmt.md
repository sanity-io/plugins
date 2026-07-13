---
"@sanity/plugin-kit": major
---

Replace prettier with [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) and eslint with [oxlint](https://oxc.rs/docs/guide/usage/linter.html)

plugin-kit now ships shared formatter and linter configs:

- `@sanity/plugin-kit/oxfmt`: an oxfmt preset. Re-export it from an `oxfmt.config.ts` next to the `package.json` that runs oxfmt (the workspace root in a monorepo, otherwise the plugin directory):

  ```ts
  export {default} from "@sanity/plugin-kit/oxfmt"
  ```

- `@sanity/plugin-kit/oxlint`: an oxlint config with type-aware rules and TypeScript type checking enabled (via oxlint-tsgolint) and warnings treated as errors. Re-export it from an `oxlint.config.ts` in the same location (or [extend it](https://oxc.rs/docs/guide/usage/linter/config.html#extend-shared-configs) with `defineConfig({extends: [...]})` to customize):

  ```ts
  export {default} from "@sanity/plugin-kit/oxlint"
  ```

Breaking changes:

- `init` and `inject` scaffold oxfmt and oxlint (`oxfmt.config.ts` and `oxlint.config.ts`, `oxfmt`/`oxlint`/`oxlint-tsgolint` devDependencies, `format: "oxfmt"` and `lint: "oxlint"` scripts) instead of prettier and eslint. The `--no-prettier` flag is now `--no-oxfmt`, `--no-eslint` is now `--no-oxlint`, and the prettier/eslint devDependencies (`prettier`, `prettier-plugin-packagejson`, `eslint`, `eslint-config-*`, `eslint-plugin-*`, `@typescript-eslint/*`) are no longer added.
- `verify-package` no longer runs `tsc --build` after the checks pass: oxlint type-checks as part of linting, so the `tsc` check key is gone and plugins no longer need a standalone type-check step.
- `verify-package` replaces the duplicate-prettier/eslint-config checks with new `oxfmt` and `oxlint` checks: they verify a config using the shared plugin-kit preset/config exists in the expected location (the workspace root when a monorepo is detected, otherwise next to the plugin's `package.json`), and fail on leftover prettier/eslint configuration with migration instructions. Disable them with `sanityPlugin.verifyPackage.oxfmt: false` / `sanityPlugin.verifyPackage.oxlint: false`.
- The Sanity v2 imports check (the `eslintImports` key) is removed entirely from `verify-package` and `verify-studio` - plugins are no longer linted for v2-era imports. The `eslint` and `typescript` peer dependencies are gone (`oxfmt` and `oxlint` are peers instead).
- The `semver-workflow` preset's lint-staged config now runs oxfmt and oxlint (instead of eslint and `tsc --build`).

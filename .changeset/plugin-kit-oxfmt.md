---
"@sanity/plugin-kit": major
---

Replace prettier with [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html)

plugin-kit now ships a shared oxfmt preset as `@sanity/plugin-kit/oxfmt`. Re-export it from an `oxfmt.config.ts` next to the `package.json` that runs oxfmt (the workspace root in a monorepo, otherwise the plugin directory):

```ts
export {default} from "@sanity/plugin-kit/oxfmt"
```

Breaking changes:

- `init` and `inject` scaffold `oxfmt` (an `oxfmt.config.ts`, an `oxfmt` devDependency and a `format: "oxfmt"` script) instead of prettier. The `--no-prettier` flag is now `--no-oxfmt`, and the `prettier`, `prettier-plugin-packagejson` and `eslint-plugin-prettier` devDependencies are no longer added (`eslint-config-prettier` is kept to stop stylistic ESLint rules from conflicting with the formatter).
- `verify-package` replaces the duplicate-prettier-config check with a new `oxfmt` check: it verifies an oxfmt config using the plugin-kit preset exists in the expected location (the workspace root when a monorepo is detected, otherwise next to the plugin's `package.json`), and fails on leftover prettier configuration with migration instructions (`npx oxfmt --migrate=prettier`). Disable it with `sanityPlugin.verifyPackage.oxfmt: false`.

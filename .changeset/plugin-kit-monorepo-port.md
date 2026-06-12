---
'@sanity/plugin-kit': major
---

Port @sanity/plugin-kit to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **ESM-only**: CommonJS support has been removed. The package now ships only ESM. The `plugin-kit` CLI is unaffected, but Node API consumers must import the package from an ES module
- **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)
- **@sanity/pkg-utils v10**: The internal `@sanity/pkg-utils` dependency was upgraded from v8 to v10
- **`cliEntry()` signature change**: The unused `autoExit` parameter has been removed; the new signature is `cliEntry(argv)`

Fixes for @sanity/pkg-utils v10 compatibility:

- `init` now adds a `@public` release tag to the generated plugin source, so `pkg-utils build --strict` passes on freshly initialized plugins
- `verify-package`, `verify-studio`, `inject`, and `link-watch` now read `package.config.ts` correctly from CommonJS plugins

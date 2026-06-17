---
'@sanity/plugin-kit': major
---

author: @rexxars
author: @snorrees
author: @stipsan
author: @mariuslundgard
author: @hdoro
author: @nkgentile
author: @runeb
author: @dorelljames
author: @geball
author: @rcmaples

Port @sanity/plugin-kit to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **ESM-only**: CommonJS support has been removed. The package now ships only ESM. The `plugin-kit` CLI is unaffected, but Node API consumers must import the package from an ES module
- **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)
- **@sanity/pkg-utils v10**: The internal `@sanity/pkg-utils` dependency was upgraded from v8 to v10
- **`cliEntry()` signature change**: The unused `autoExit` parameter has been removed; the new signature is `cliEntry(argv)`
- **`init` generates `package.config.mts`** (or `package.config.mjs` with `--no-typescript`) instead of `package.config.ts`/`.js`, so the config is always interpreted as ESM

Fixes for @sanity/pkg-utils v10 and Node 24 compatibility:

- `verify-package`, `verify-studio`, `inject`, and `link-watch` now load `package.config` files with jiti. The tsx-based config loader in @sanity/pkg-utils v10 cannot load TypeScript config files from CommonJS plugins on Node 24, and silently ignores them on older Node versions
- The ESM-interpreted `package.config.mts` also makes `pkg-utils build` work on Node 24 for the generated (CommonJS) plugins
- `init` now adds a `@public` release tag to the generated plugin source, so `pkg-utils build --strict` passes even when the config's relaxed `extract.rules` are not picked up

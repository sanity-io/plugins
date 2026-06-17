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
- **Plugins must be ESM**: `verify-package` now hard-fails (non-configurable) unless the plugin's `package.json` declares `"type": "module"`. CommonJS plugins are no longer supported
- **`@sanity/pkg-utils` is now a peer dependency** (was a direct dependency). plugin-kit loads `package.config.ts` through the plugin's own `@sanity/pkg-utils` install, and `verify-package` requires `@sanity/pkg-utils` v10 or newer
- **`typescript` is now a peer dependency** (`5.8.x || 5.9.x || 6.0.x`) instead of a direct dependency, matching how `@sanity/pkg-utils` declares it
- **`cliEntry()` signature change**: The unused `autoExit` parameter has been removed; the new signature is `cliEntry(argv)`
- **`init` always generates `package.config.ts`** (instead of `package.config.ts`/`.js`/`.mts`/`.mjs`) and scaffolds plugins as ESM (`"type": "module"`) with ESM-only `exports`
- **Generated plugins require Node.js `>=20.19 <22 || >=22.12`** (was `>=18`), matching `@sanity/pkg-utils`. `verify-package` validates this `engines.node` range

Other changes:

- `verify-package`, `verify-studio`, `inject`, and `link-watch` load `package.config` files with `loadConfig` from the plugin's `@sanity/pkg-utils` peer (replacing the previous jiti-based loader), so the config is parsed with the exact pkg-utils version the plugin builds with
- CLI help and error text now refer to the command as `plugin-kit` (previously `sanity-plugin` in some messages); the npm bin is unchanged
- `init` now adds a `@public` release tag to the generated plugin source, so `pkg-utils build --strict` passes even when the config's relaxed `extract.rules` are not picked up

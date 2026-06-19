---
"@sanity/plugin-kit": major
---

Remove `@sanity/incompatible-plugin` from scaffolding and detect leftover usage

`init` and `inject` no longer add the `@sanity/incompatible-plugin` dependency or scaffold the `sanity.json` and `v2-incompatible.js` Sanity Studio v2 compatibility shim. `verify-package` now fails when it detects that a plugin still ships the shim (dependency, `v2-incompatible.js`, or a `sanity.json` referencing it) and explains how to remove it. The `sanityPlugin.verifyPackage.sanityV2Json` config option has been renamed to `incompatiblePlugin`.

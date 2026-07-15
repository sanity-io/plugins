---
"@sanity/plugin-kit": major
---

Remove Sanity Studio v2 upgrade and compatibility tooling

`verify-studio` is removed. `verify-package` no longer checks for leftover v2 shims (`@sanity/incompatible-plugin`, `v2-incompatible.js`, `sanity.json` parts), obsolete `@sanity/*` package dependencies, or `part:`/`config:` imports. Package verification now focuses on current plugin-kit conventions for modern Studio plugins.

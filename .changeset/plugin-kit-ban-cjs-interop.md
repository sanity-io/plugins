---
"@sanity/plugin-kit": minor
---

Add a `verify-package` check that bans CommonJS interop in `package.json`

`verify-package` now flags `require` export conditions and top-level `main`/`module` fields. The plugin baseline is Sanity Studio v5+, which is pure ESM, so there is no need to publish a CommonJS build. Supporting CJS is not worth it: it can have unintended side-effects, and the Node.js versions plugin-kit supports fully handle `require(esm)`, so a single published format keeps two copies of a plugin's code out of the module tree (avoiding bundle bloat and slower builds). Disable the check with `"sanityPlugin": { "verifyPackage": { "esmOnly": false } }`.

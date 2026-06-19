---
"sanity-plugin-mux-input": major
---

Drop the CommonJS build and publish ESM only

The plugin now ships only an ES module build: the top-level `main` field and the `require` export condition (in both `exports` and `publishConfig.exports`) have been removed. Sanity Studio v5+ is pure ESM and the supported Node.js versions handle `require(esm)`, so a parallel CommonJS build is no longer needed and only risks two copies of the code ending up in the module tree. This is a breaking change for any consumer that loaded the CommonJS build directly.

---
"sanity-plugin-mux-input": patch
---

Switch from `lodash` to `lodash-es`, remove unused internal code, and align the package exports with the monorepo convention (`publishConfig.exports` plus `development`/`source` conditions). Also make the Mux input's polling hook null-safe so it no longer crashes when the field has no value yet. No changes to the public API.

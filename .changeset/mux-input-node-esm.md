---
'sanity-plugin-mux-input': patch
---

Fix importing the plugin under Node ESM (for example a Studio embedded in Next.js, or Node scripts that load `sanity.config.ts`), which crashed with "Named export 'compact' not found". The plugin no longer depends on `lodash`, and imports `use-error-boundary` in a way that works for its CommonJS build.

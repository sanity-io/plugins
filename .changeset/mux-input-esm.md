---
'sanity-plugin-mux-input': patch
---

Migrate to ESM (`"type": "module"`) and upgrade `@sanity/pkg-utils` to v10, as required by `@sanity/plugin-kit`. The package still ships both ESM and CommonJS builds via the `exports` map, so consumers are unaffected.

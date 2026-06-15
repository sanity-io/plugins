---
'sanity-plugin-mux-input': patch
---

Move sanity-plugin-mux-input into the sanity-io/plugins monorepo

No functional or API changes. The published package (build output, runtime dependencies, peer dependencies, exports, and supported engines) is unchanged — this patch release verifies the plugin can be published from the monorepo. Adopting monorepo conventions (ESM-only build, React Compiler, lint fixes) will follow in subsequent releases.

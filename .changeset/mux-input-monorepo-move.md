---
'sanity-plugin-mux-input': patch
---

Move sanity-plugin-mux-input into the sanity-io/plugins monorepo

No API or behavioral changes — this patch release verifies the plugin can be published from the monorepo. The only dependency change is that `@mux/mux-player` and `use-device-pixel-ratio` are now declared explicitly (they were already used at runtime, previously resolved transitively). Exports, peer dependencies, supported engines, and the dual CJS+ESM build output are unchanged. Adopting monorepo conventions (ESM-only build, React Compiler, lint fixes) will follow in subsequent releases.

---
'@sanity/presets': minor
---

Replace plugin-based API with a registry-based API. `createPresetsRegistry()` is the new entry point — it returns `define<Type>` functions that produce schema types directly, added to `schema.types` instead of `plugins`.

Key changes:

- **Registry-level configuration.** Configure `link.internalTypes` once and it cascades to every preset that composes a link (CTA, rich text).
- **User-defined type names.** All `name` values are provided at the call site.
- **Inline composition.** Composed presets (e.g. the link inside a CTA) are inlined as anonymous object fields via `registry.getPreset()`, replacing the previous `composes` mechanism.
- **Map hooks.** Every preset accepts a `map` option for full control over the produced schema type.

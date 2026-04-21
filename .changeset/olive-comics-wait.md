---
'@sanity/presets': minor
---

Replace plugin-based API with a registry-based API.

`createPresetsRegistry()` is the new entry point. It returns `defineLink`, `defineCta`, `defineSeo`, `defineImage`, and `definePage` functions that produce schema types directly — no plugin wrapper needed.

Schema types are added to `schema.types` instead of `plugins`:

```ts
const {defineLink, defineCta, definePage} = createPresetsRegistry({
  link: { internalTypes: ['page', 'post'] },
})

// sanity.config.ts
schema: {
  types: [
    definePage({ name: 'page', title: 'Page', pageBuilderBlocks: ['hero'] }),
    defineLink({ name: 'navLink', title: 'Nav Link' }),
  ],
}
```

Key changes:

- **Registry-level configuration.** Configure `link.internalTypes` once and it cascades to every preset that composes a link (CTA, rich text).
- **User-defined type names.** All `name` values are provided at the call site — no more hardcoded type names.
- **Inline composition.** Composed presets (e.g. the link inside a CTA) are inlined as anonymous object fields via `registry.getPreset()`, replacing the previous `composes` mechanism.
- **Map hooks.** Every preset accepts a `map` option for full control over the produced schema type.
- **Removed exports:** `presets()`, `linkType`, `ctaType`, `imageType`, `pageType`, `seoType`, all `*_TYPE_NAME` constants, and `PresetResult`.

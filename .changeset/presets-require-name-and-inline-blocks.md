---
'@sanity/presets': minor
---

`name` is now required on every `define<Type>` factory (`defineLink`, `defineCta`, `defineSeo`, `defineImage`, `definePage`, `defineRichText`). Calls without a name fail at the type level and throw at runtime.

`definePage`'s `pageBuilderBlocks` now accepts inline preset instances alongside string type-name references, so you can mix both: `pageBuilderBlocks: ['hero', defineImage({name: 'imageBlock'})]`.

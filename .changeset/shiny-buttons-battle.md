---
"@sanity/presets": minor
---

Refactor preset composer and link type APIs:

```diff
-presetsComposer([linkField({internalTypes: ['corePresetsTest']})])
+presets(linkType({internalTypes: ['corePresetsTest']}))
```

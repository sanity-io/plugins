---
'@sanity/presets': patch
---

`definePage` now accepts rich text presets in `pageBuilderBlocks`, both inline (`defineRichText({...})`) and by name (`'richText'`). Documents store each rich text block as `{_type, content: [...]}`.

---
'sanity-plugin-mux-input': patch
---

Remove the `type-fest` dependency. It was only used for the `PartialDeep` type of `VideoAssetDocument['data']`, which is now defined locally.

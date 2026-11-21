---
'sanity-plugin-utils': patch
---

Remove the `@sanity/asset-utils` dependency. `useImageUrlBuilderImage` now types its `source` argument with `SanityImageSource` from `@sanity/image-url`, the type the image URL builder itself accepts.

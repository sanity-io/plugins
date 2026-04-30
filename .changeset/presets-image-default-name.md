---
'@sanity/presets': minor
---

Change the default schema type name produced by `defineImage()` from `image` to `imageObject`. The previous default collided with Sanity's reserved `image` type, so registering `defineImage()` at the top of `schema.types` failed with a "reserved name" error.

Migration: callers that relied on the old default need to either pass an explicit `name` (e.g. `defineImage({name: 'image'})` would still error, so use any non-reserved name like `defineImage({name: 'heroImage'})`) or update existing references from `'image'` to `'imageObject'` (for example in `pageBuilderBlocks` arrays).

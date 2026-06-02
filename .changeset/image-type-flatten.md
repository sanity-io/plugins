---
"@sanity/presets": minor
---

`defineImage` now returns a native Sanity `image` type instead of an `object` wrapper. `altText` and `caption` are added via the image type's `fields` array; `hotspot` is controlled via the top-level `options`.

**Migration note - data path changes**

If you have content saved with an earlier pre-release of this package, the asset, hotspot, and crop paths have moved:

| Property | Before | After |
|---|---|---|
| Asset | `<field>.image.asset` | `<field>.asset` |
| Hotspot | `<field>.image.hotspot` | `<field>.hotspot` |
| Crop | `<field>.image.crop` | `<field>.crop` |

`altText` and `caption` remain at `<field>.altText` and `<field>.caption` - their paths are unchanged.

**Schema type change**

The `map` hook for `defineImage` now targets `ImageDefinition` keys (e.g. `fields`, `options`) rather than `ObjectDefinition` keys.

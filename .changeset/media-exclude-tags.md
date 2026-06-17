---
'sanity-plugin-media': minor
---

author: @nickeforsberg

Add an `excludeTags` option that hides assets referencing the listed `media.tag` slugs (`name.current` values). Excluded assets are omitted from the Media browser grid and asset-picker queries, and the matching tags are hidden from the tag sidebar and tag search facet. The asset edit dialog still lists all tags so you can assign or remove them on an open asset.

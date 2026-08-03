---
"sanity-plugin-cloudinary": minor
---

author: @ChrisLaRocque

Add performant preview images

Asset previews and diffs now build an optimized, scaled-down preview URL with `@cloudinary/url-gen` (a 400px-wide transformation) when a cloud name is configured, instead of loading the full-size original. This keeps the Studio fast when previewing large Cloudinary assets, and falls back to the stored asset URL when no cloud name is available.

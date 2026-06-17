---
'sanity-plugin-media': patch
---

author: @oxygensmith

Add `crossOrigin="anonymous"` to the image thumbnail component so thumbnails load in Firefox. Firefox's Opaque Response Blocking would otherwise block Sanity CDN asset responses (which send `Vary: Origin`) when requested without an `Origin` header.

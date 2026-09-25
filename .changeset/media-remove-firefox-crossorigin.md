---
"sanity-plugin-media": patch
---

Remove `crossOrigin="anonymous"` from the image thumbnail component. The Firefox Opaque Response Blocking issue it worked around — Sanity CDN asset responses sending `Vary: Origin` — is fixed at the API gateway, verified by green Firefox e2e runs in [sanity-io/sanity#14928](https://github.com/sanity-io/sanity/pull/14928). Thumbnails now load in Firefox without the client opting into CORS requests, so the workaround added in [#1108](https://github.com/sanity-io/plugins/pull/1108) (thanks [@oxygensmith](https://github.com/oxygensmith)) is no longer needed.

---
'sanity-plugin-mux-input': patch
---

Remove the `jsonwebtoken-esm` dependency. Signed playback, thumbnail and storyboard tokens are now signed with the browser's built-in Web Crypto API, which shrinks the lazily loaded signing chunk by about 180 KB gzipped. Tokens are reused for up to an hour, so each one still has at least 11 hours left before it expires.

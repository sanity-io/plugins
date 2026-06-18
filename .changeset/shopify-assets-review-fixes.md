---
'sanity-plugin-shopify-assets': patch
---

Harden the Shopify asset input and picker: safely read `shopifyDomain` when `options` is undefined, dispose the Video.js player on unmount instead of leaking it, open the Shopify admin link with `noopener,noreferrer`, stop mutating search-result objects on select, and URL-encode `shop`/`cursor` query params while de-duplicating identical search requests

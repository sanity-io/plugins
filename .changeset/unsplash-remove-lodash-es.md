---
'sanity-plugin-asset-source-unsplash': patch
---

Remove the `lodash-es` dependency. Search results are still cached per query and page, now with a small local cache instead of `memoize`.

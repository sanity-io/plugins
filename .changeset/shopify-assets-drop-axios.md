---
'sanity-plugin-shopify-assets': patch
---

Replace `axios` with the native `fetch` API. In-flight asset requests are now aborted when a newer search supersedes them.

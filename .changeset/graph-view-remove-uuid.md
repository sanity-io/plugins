---
'sanity-plugin-graph-view': patch
---

Remove the `uuid` dependency. Session ids are now created with the built-in `crypto.randomUUID()`.

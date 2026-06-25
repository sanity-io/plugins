---
"@sanity/google-maps-input": patch
---

Avoid a runtime error in the `geopointRadius` list preview when a document has an incomplete location: `prepare` now guards against missing `lat`/`lng` and shows "No location set" instead of throwing on `lat.toFixed()`.

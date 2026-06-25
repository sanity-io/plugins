---
"@sanity/google-maps-input": patch
---

Fix `InvalidValueError` thrown when editing an empty geopoint (e.g. a newly added array item). Map markers, circles, the map center and the radius preview are now only rendered once the value has finite `lat`/`lng` coordinates, so adding a new item to an array of geopoints no longer crashes the input.

---
"@sanity/google-maps-input": patch
---

Fix `InvalidValueError` ("not an instance of LatLng … in property lat: not a number") thrown when opening the map editor for an empty geopoint, such as a newly added array item. Map markers, the radius circle and the map center are now only rendered once the value has finite `lat`/`lng` coordinates, and empty items show a "Set location" button instead of a broken preview.

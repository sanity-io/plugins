---
"sanity-plugin-graph-view": patch
---

Replace `deep-equal` with `dequal/lite` for the reference-list comparison on live mutations. The previous comparator cost ~180µs per call regardless of input and added ~52 KB (minified) of transitive polyfill code to the studio bundle; `dequal/lite` is ~500 bytes and 400–10,000x faster on these string arrays.

---
"sanity-plugin-utils": patch
---

Replace `react-fast-compare` with `dequal/lite` in `useListeningQuery`. Listener results are plain JSON, so the React-element handling was unused; the swap keeps the same verdicts, is marginally faster on no-op emissions, and drops ~1.9 KB of minified JS.

---
'@sanity/embeddings-index-ui': patch
---

Update `react-rx` to v7. Document previews in the embeddings index results now render their loading placeholder on the first paint and subscribe to the preview state once mounted, matching the Studio's own previews. `react-rx` v7 requires React `^19.2` (already required) and declares Node `>=22.12`.

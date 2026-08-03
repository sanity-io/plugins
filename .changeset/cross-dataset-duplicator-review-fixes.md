---
"@sanity/cross-dataset-duplicator": patch
---

Fix several issues surfaced in code review:

- Duplicating an SVG asset no longer leaves an orphaned asset document at the destination; a single merged asset document is created at the uploaded `_id`
- Asset downloads now fail fast with a clear error (e.g. on 401/403/404) instead of uploading the error response body as the asset
- The progress bar no longer produces an invalid transform when duplicating documents that include no assets
- The duplicate button label now reads correctly for single-item and asset-only selections
- SVG reference remapping no longer mutates documents held in component state
- Tightened the "already exists" status tooltip copy
- Cleaned up the README: corrected the `defineConfig` example and removed stale standalone-repo instructions

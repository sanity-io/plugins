---
"@sanity/cross-dataset-duplicator": patch
---

Address post-migration review feedback:

- Fail fast (instead of uploading the error body as an asset) when an asset download responds with a non-OK status
- Duplicate SVG assets as a single, complete asset document under the new `_id` so no orphaned asset document is left at the destination
- Avoid mutating documents held in React state when remapping SVG references
- Use an index map for destination status lookups so checks stay linear for larger payloads
- Guard the progress bar against a divide-by-zero when no assets are being duplicated
- Fix the "Duplicate …" button label to show single-item counts and only insert "and" when both documents and assets are selected
- Tidy the `EXISTS` status tooltip copy

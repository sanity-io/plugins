---
'@sanity/assist': minor
---

Add `assist.maxFieldSelectionDepth` config option to control how deep the AI Assist field picker (and per-field assist actions) traverses nested schemas. Previously this was hardcoded to 6, which silently hid deeply nested fields — e.g. locale string fields at depth 7 — from the "field" picker so instructions could not be attached to them. Defaults to 6 (unchanged behavior).

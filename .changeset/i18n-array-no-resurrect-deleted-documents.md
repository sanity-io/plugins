---
'sanity-plugin-internationalized-array': patch
---

Fix deleted documents being recreated as empty drafts when `defaultLanguages` is configured. The auto-add effect now only patches documents that exist in the dataset (have a `_rev`) and skips documents the pane reports as deleted. This also means new documents no longer get a draft created just by opening the form — default languages are added after the user's first edit.

---
'sanity-plugin-internationalized-array': patch
---

Fix "restore order" action on read-only documents

Previously, the automatic "restore order" action would attempt to patch read-only documents, resulting in an error. The action now checks the document's read-only status before executing.

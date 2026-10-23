---
'@sanity/hierarchical-document-list': patch
---

Dragging an item under another one nests it again. `@nosferatu500/react-sortable-tree` is pinned to 5.0.0, because 5.1.0 reports no parent for nested drops, so they were saved at the top level.

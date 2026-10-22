---
'@sanity/hierarchical-document-list': patch
---

Tree rows no longer re-render whenever the surrounding form or structure pane re-renders. The tree's add, duplicate, remove and move actions now keep the same identity between renders.

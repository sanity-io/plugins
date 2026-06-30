---
"@sanity/hierarchical-document-list": patch
---

Replace memoized `forwardRef` link wrappers with the `as` prop on `Card`/`MenuItem`, forwarding router props directly (no more nested components defined during render)

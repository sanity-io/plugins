---
"@sanity/cross-dataset-duplicator": patch
---

author: @rohanvachheta

Handle reference errors during duplication by fetching missing referenced documents (including transitive refs, respecting `filter`), re-uploading any recovered assets, and retrying the transaction, with a one-by-one commit fallback

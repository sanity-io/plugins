---
'@sanity/cross-dataset-duplicator': patch
---

author: @rohanvachheta

Handle reference errors during duplication by fetching missing referenced documents and retrying the transaction, with a one-by-one commit fallback

---
'@sanity/assist': patch
---

Translate fields skips fields that are read-only, hidden, or excluded from AI Assist, including internationalized array fields. Those fields are no longer overwritten, and excluded fields no longer fail translation because their schema was omitted.

---
'@sanity/assist': patch
---

Translate fields no longer overwrites fields with `readOnly: true` or `hidden: true`, including internationalized array fields. Fields with `options.aiAssist.exclude: true` are no longer sent as translation targets.

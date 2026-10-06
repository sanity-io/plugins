---
'sanity-plugin-internationalized-array': patch
---

Add `allowRemovingDefaultLanguages` so configured default languages can be removed. They are still added when the field has no value yet, and a removed row is not inserted again.

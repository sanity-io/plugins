---
'sanity-plugin-internationalized-array': patch
---

Add `allowRemovingDefaultLanguages` so configured default languages can be removed. They are still added on a new document, and are not inserted again once that document has history.

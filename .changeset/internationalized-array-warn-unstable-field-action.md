---
"sanity-plugin-internationalized-array": patch
---

Warn and skip `buttonLocations: ['unstable__fieldAction']` — it crashes the document editor on Studio v4, v5, and v6 (`useFormValue` outside `FormValueProvider`).

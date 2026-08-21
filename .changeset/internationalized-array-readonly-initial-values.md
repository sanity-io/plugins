---
"sanity-plugin-internationalized-array": patch
---

Wait until the document is writable before auto-adding default languages, so creating a document no longer toasts "Attempted to patch a read-only document" while initial value templates are still resolving

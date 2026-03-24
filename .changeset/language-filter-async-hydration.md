---
"@sanity/language-filter": patch
---

Improve language filter initialization when `supportedLanguages` is resolved asynchronously.

Selected language hydration now consistently combines default languages with persisted language selections, and keeps filtering constrained to supported/selectable languages.

---
'@sanity/language-filter': patch
---

Update `react-rx` to v7. The selected language ids exposed by `useLanguageFilterStudioContext` are now derived from the resolved languages and the persisted selection during render, instead of being pushed into state from inside the language stream. Languages are still resolved once per Studio session and the selection behaves as before. `react-rx` v7 requires React `^19.2` (already required) and declares Node `>=22.12`.

---
"@sanity/document-internationalization": patch
---

Fix the Translations menu being disabled for documents that only exist in a release. When a release is selected, the version document is now used as the source for translations, and new language copies are created in that same release.

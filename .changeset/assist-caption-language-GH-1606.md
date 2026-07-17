---
"@sanity/assist": patch
---

Fix image description (caption) generation ignoring the configured document language field (`translate.document.languageField`), causing generated alt text to always be written in English instead of the document's language.

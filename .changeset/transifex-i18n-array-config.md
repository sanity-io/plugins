---
'sanity-plugin-transifex': minor
---

Add a `defaultI18nArrayConfig` export for documents using `sanity-plugin-internationalized-array` fields, and support the new internationalization data formats where the language is stored in a dedicated `language` field instead of `_key` (`sanity-plugin-internationalized-array` v5+ and `@sanity/document-internationalization` v6+), while remaining compatible with the older `_key`-based formats.

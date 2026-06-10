---
'sanity-translations-tab': minor
---

Support the new internationalization data formats where the language is stored in a dedicated `language` field instead of `_key`. Document-level translation now finds and patches `translation.metadata` documents created by `@sanity/document-internationalization` v6+ (while remaining compatible with v5 and below), and `baseI18nArrayConfig` works with fields created by `sanity-plugin-internationalized-array` v5+ (while remaining compatible with v4 and below).

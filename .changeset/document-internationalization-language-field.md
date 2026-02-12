---
"@sanity/document-internationalization": major
---

Support sanity-plugin-internationalized-array v5 language field format

**Breaking change:** Translation reference items now use a dedicated `language` field instead of `_key` for the language identifier. The `_key` is now a random unique ID.

If you have existing `translation.metadata` documents, you must run the migration. See the [internationalized-array migration guide](https://github.com/sanity-io/plugins/tree/main/plugins/sanity-plugin-internationalized-array#migrate-from-v4-to-v5) and include `'translation.metadata'` in your migration's document types.

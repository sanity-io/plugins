---
'sanity-translations-tab': minor
---

Support both `translation.metadata` data formats. Document-level translation now reads the language from either the legacy `_key` or the new `language` field (`@sanity/document-internationalization` v6), and mirrors the existing document's format when writing. New metadata documents default to the `language` field format, configurable via the new `newMetadataFormat` option (`'language-field' | 'legacy'`).

---
'@sanity/document-internationalization': minor
---

Add `languageFilter` plugin option to restrict the Translations menu language list per document type. Receives `{schemaType, defaultLanguages}` and returns the subset of languages to render. Only affects the menu UI - badges, templates, and validity checks continue to use the full `supportedLanguages` list. Closes #570.

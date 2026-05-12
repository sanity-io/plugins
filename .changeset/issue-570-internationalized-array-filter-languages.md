---
'sanity-plugin-internationalized-array': minor
---

Add `filterLanguages` plugin option to restrict the add-language buttons (and the "add missing languages" action) per document type. Receives `{schemaType, defaultLanguages}` and returns the subset of languages to render. Composes with `@sanity/language-filter`: the static filter runs first to narrow the universe, then the user's per-session selection is applied on top. Existing array values are never removed or hidden, only the buttons. Companion to `@sanity/document-internationalization`'s `languageFilter` (issue #570).

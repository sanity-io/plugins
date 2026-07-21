---
"@sanity/code-input": minor
---

Export `SUPPORTED_LANGUAGES` and `LANGUAGE_ALIASES` from the package root. Downstream tooling that maps external language tokens (markdown fence infostrings, import pipelines) onto `code` field values can now consume the canonical list the Language selector offers instead of vendoring a copy that drifts.

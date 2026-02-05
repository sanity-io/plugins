---
"sanity-plugin-internationalized-array": patch
---

Introduce `LANGUAGE_FIELD_NAME` constant for language identification

This is an internal refactor that centralizes how language identification is handled in internationalized array items. No user-facing changes - the plugin functions identically to before.

This prepares the codebase for a future migration from storing language IDs in `_key` to a dedicated `language` field.

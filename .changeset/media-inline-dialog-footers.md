---
"sanity-plugin-media": patch
---

Fix the Save button staying disabled when editing filename, title, alt text, or description in the asset details dialog. The form reset that runs when the dialog opens (and when the asset or tag is updated elsewhere) now keeps fields registered (`keepFieldsRef`), which is required now that the plugin is built with React Compiler. Dialog footers are also no longer declared as inline components, so the footer no longer remounts whenever form state changes.

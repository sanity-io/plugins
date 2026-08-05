---
"sanity-plugin-media": patch
---

Re-enable React Compiler for the asset details form. The underlying issue is fixed at the root: the form reset that runs when the dialog opens (and when the asset or tag is updated elsewhere) now keeps fields registered (`keepFieldsRef`), so registered string fields keep reporting changes under compiler memoization. The remaining dialog footers (and the confirm dialog header) are also no longer declared as inline components, so they no longer remount whenever form state changes.

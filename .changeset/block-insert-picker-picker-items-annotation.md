---
"@sanity/block-insert-picker": patch
---

Annotate the `usePickerItemsContext` memo with its return type so the plugin keeps compiling against newer Sanity Studio schema types, which are deep enough to hit the compiler's type-comparison depth limit when the type is only inferred

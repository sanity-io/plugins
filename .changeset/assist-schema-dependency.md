---
"@sanity/assist": patch
---

Move `@sanity/schema` from `devDependencies` to `dependencies` so it is treated as an internal implementation detail and consumers do not need to install it separately.

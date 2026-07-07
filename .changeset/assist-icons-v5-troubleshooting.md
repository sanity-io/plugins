---
"@sanity/assist": patch
---

Fix a crash ("Element type is invalid … got: <Icon />") when rendering the instruction list for instructions with a custom icon. Since the `@sanity/icons` v5 migration the instruction preview received a rendered icon element but kept rendering it as a component; it now handles both. The README also gains a troubleshooting section for `MISSING_EXPORT` icon build errors, which come from code importing icons from the `@sanity/icons` package root — a pattern removed in v5 (this plugin already uses the per-icon export paths).

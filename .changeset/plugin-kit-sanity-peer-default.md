---
"@sanity/plugin-kit": patch
---

Scaffold the `sanity` peer dependency as `^5 || ^6.0.0-0`

`init` and `inject` previously forced a stale `sanity` peer dependency range of `^3` onto generated plugins. They now declare `sanity` as `^5 || ^6.0.0-0`, matching the current plugin baseline.

---
"@sanity/plugin-kit": patch
---

Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior of the CLI. `@sanity/pkg-utils` remains a peer dependency, resolved from the plugin under verification at runtime.

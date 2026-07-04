---
"sanity-plugin-mux-input": patch
---

Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior. The `process.env.PKG_VERSION` constant is still replaced with the package version at build time.

---
"@sanity/google-maps-input": patch
---

The vanilla-extract CSS bundle is now built by `@sanity/vanilla-extract-tsdown-plugin` (via `@sanity/tsdown-config` 0.14.0) instead of `@vanilla-extract/rollup-plugin`. `dist/bundle.css` is slightly smaller, the `dist/bundle.css.map` sourcemap is no longer emitted (aligned with `@tsdown/css` behavior), and the `bundle.css.js` node shim is now a comment-only no-op module instead of `export default ""`

---
"sanity-plugin-markdown": patch
---

Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior. The `sanity-plugin-markdown/next` entry point is unchanged, but its file inside the published `dist` folder is renamed from `indexNext.js` to `next.js`.

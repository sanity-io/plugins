---
"sanity-plugin-latex-input": major
---

Migrated from standalone repository (https://github.com/sanity-io/latex-input) into the plugins monorepo.

Breaking changes:
- Now requires React 19.2+ and Sanity Studio v5+
- CJS output dropped; ESM only
- React Compiler enabled
- `LatexPreview` component rewritten to derive HTML directly from props (no internal state)
- Module augmentation moved from `@sanity/types` to `sanity`

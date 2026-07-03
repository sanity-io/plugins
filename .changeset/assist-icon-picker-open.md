---
"@sanity/assist": patch
---

Fix the instruction icon picker not opening on first click. The lazy-loaded icons from `@sanity/icons` v5 suspended the menu before it could render; each menu item now renders through the `Icon` component, which provides its own suspense fallback.

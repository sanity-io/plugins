---
"@sanity/color-input": minor
---

Migrate styling from `styled-components` and inline `style` objects to vanilla-extract. The plugin no longer requires a `styled-components` peer dependency; styles ship via the `./bundle.css` export (auto-injected when importing the package).

---
'sanity-plugin-markdown': patch
---

Migrate styling from styled-components to CSS modules (`*.module.css`), compiled by `@tsdown/css` with Lightning CSS. The stylesheet ships as `sanity-plugin-markdown/bundle.css` (auto-imported from the default entry; import it from `_app` when using `/next`). Studio theme tokens are bridged via namespaced custom properties. `styled-components` is no longer a peer dependency.

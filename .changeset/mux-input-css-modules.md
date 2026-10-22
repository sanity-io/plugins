---
'sanity-plugin-mux-input': patch
---

Migrate styling from styled-components to plain CSS modules, compiled by `@tsdown/css` with Lightning CSS. The stylesheet still ships as `sanity-plugin-mux-input/bundle.css` with the same conditional export, so nothing changes for a Studio that uses the plugin. Class names are now hashed from each stylesheet's content, so a release that changes a file's styles gets new class names. `styled-components` is no longer a dependency.

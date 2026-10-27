---
'sanity-plugin-asset-source-unsplash': patch
---

The plugin is styled with plain CSS modules, compiled by `@tsdown/css` with Lightning CSS, instead of vanilla-extract. The stylesheet still ships as `sanity-plugin-asset-source-unsplash/bundle.css`, so nothing changes for a Studio that uses the plugin. Its class names are now hashed from each stylesheet's content, so a release that changes a file's styles gets new class names, and a page that loads the stylesheets of two releases can't style elements with the wrong release's rules.

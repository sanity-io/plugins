---
'@sanity/themer': patch
---

The themer tool is styled with plain CSS modules, compiled by `@tsdown/css` with Lightning CSS, instead of vanilla-extract. The stylesheet still ships as `@sanity/themer/bundle.css` and `@sanity/themer/tool` still imports it itself, so nothing changes for a Studio that uses the plugin. Its class names are now hashed from each stylesheet's content, so a release that changes a file's styles gets new class names, and a page that loads the stylesheets of two releases can't style elements with the wrong release's rules. `@vanilla-extract/dynamic` is no longer a dependency.

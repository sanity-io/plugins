---
'sanity-plugin-media': patch
---

The plugin's styling (besides the folder tree's drag-and-drop highlight, which still uses styled-components) is now plain CSS modules, compiled by `@tsdown/css` with Lightning CSS, instead of vanilla-extract. The stylesheet still ships as `sanity-plugin-media/bundle.css`, so nothing changes for a Studio that uses the plugin. Its class names are now hashed from each stylesheet's content, so a release that changes a file's styles gets new class names, and a page that loads the stylesheets of two releases can't style elements with the wrong release's rules. `@vanilla-extract/css`, `@vanilla-extract/dynamic`, `@sanity/vanilla-extract-vite-plugin` and `clsx` are no longer dependencies.

---
'sanity-plugin-cloudinary': patch
---

Migrate styling from styled-components to CSS modules compiled by `@tsdown/css` with Lightning CSS. Styles ship as the `sanity-plugin-cloudinary/bundle.css` stylesheet, which the package entry imports itself, and `styled-components` is no longer a peer dependency.

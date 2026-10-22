---
'sanity-plugin-dashboard-widget-netlify': patch
---

Migrate styling from styled-components to CSS modules. The plugin no longer requires a `styled-components` peer dependency; styles ship via the `./bundle.css` export (auto-injected when importing the package).

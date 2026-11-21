---
'sanity-plugin-dashboard-widget-document-list': patch
---

Remove the `lodash-es` dependency. The `intersection` and `uniqBy` calls are replaced with native array methods.

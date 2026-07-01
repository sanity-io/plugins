---
"sanity-plugin-dashboard-widget-vercel": patch
---

Fix "No locale data has been registered" runtime error in the deployments widget. The side-effect-only `react-time-ago/locale/en` import (added in #1373) was tree-shaken out of the published bundle since it has no bindings; restore the explicit `javascript-time-ago` dependency and `TimeAgo.addDefaultLocale(en)` call so locale registration survives bundling.

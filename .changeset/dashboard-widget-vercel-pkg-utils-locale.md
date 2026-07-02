---
"sanity-plugin-dashboard-widget-vercel": patch
---

author: @mitchuman

Fix a crash in the deployments widget ("No locale data has been registered for any of the locales: en-US, en, en") by bumping `@sanity/pkg-utils`.

The published bundle was silently dropping the side-effect-only `react-time-ago/locale/en` import, because pkg-utils' tree-shaking treated all external imports as side-effect free. Thanks to @mitchuman for discovering the root cause and reporting it in [#1468](https://github.com/sanity-io/plugins/pull/1468) — it was fixed upstream in [`@sanity/pkg-utils`](https://github.com/sanity-io/pkg-utils/pull/2934), so no source changes were needed here beyond the dependency bump.

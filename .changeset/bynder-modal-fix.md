---
"sanity-plugin-bynder-input": patch
---

author: @pedrobonamin

Fix the Bynder Compact View modal not appearing in Sanity Studio v6 (and blocking clicks after closing) by upgrading `@bynder/compact-view` to 5.4.0 — now a regular dependency instead of a patched, bundled one — and styling its modal container from the plugin. `@bynder/compact-view` doesn't declare React 19 in its peer dependencies yet; see the README for how to allow it with npm (`--legacy-peer-deps`) and pnpm (`peerDependencyRules.allowedVersions`).

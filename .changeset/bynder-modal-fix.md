---
"sanity-plugin-bynder-input": major
---

author: @pedrobonamin

Fix the Bynder Compact View modal not appearing in Sanity Studio v6 (and blocking clicks after closing) by upgrading `@bynder/compact-view` to 5.4.0 and styling its modal container from the plugin.

Breaking: `@bynder/compact-view` is now a regular dependency of the plugin instead of being patched and bundled into it, and it doesn't declare React 19 in its peer dependencies yet. Installing may require allowing the stale peer range — npm: `--legacy-peer-deps`, pnpm: `peerDependencyRules.allowedVersions` — see the README for details.

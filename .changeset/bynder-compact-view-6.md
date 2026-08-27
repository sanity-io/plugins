---
"sanity-plugin-bynder-input": minor
---

Upgrade `@bynder/compact-view` to 6, which declares React 19 in its peer dependencies. Installing the plugin no longer needs the stale-peer-range workaround (`--legacy-peer-deps` on npm, `peerDependencyRules.allowedVersions` on pnpm).

Compact View 6 also reuses an already-attached shadow root instead of throwing on a second `attachShadow()` call, so the plugin no longer has to keep its modal's shadow root slotted to survive re-run passive effects (`<StrictMode>`, panes hidden and shown with `<Activity>`).

Note that Compact View 6 declares its own runtime dependencies (`styled-components`, `axios`, `zustand`, `@sentry/browser`, `use-debounce`, `react-intersection-observer`) instead of vendoring them, so they now appear in your dependency tree and dedupe against the copies Sanity Studio already ships.

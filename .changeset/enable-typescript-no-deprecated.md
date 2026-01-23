---
"@sanity/code-input": patch
"@sanity/color-input": patch
"sanity-plugin-asset-source-unsplash": patch
"sanity-plugin-graph-view": patch
"sanity-plugin-markdown": patch
"sanity-plugin-workflow": patch
---

Migrate from deprecated theme APIs to v2 theme APIs and replace deprecated hooks

- Migrated theme API access from deprecated v0 APIs (`theme.sanity.fonts`, `theme.sanity.color`, `theme.sanity.space`, `theme.sanity.radius`) to v2 APIs using `getTheme_v2` helper
- Replaced deprecated `useTimeAgo` hook with `useRelativeTime` in workflow plugin
- Replaced deprecated `useClickOutside` hook with `useClickOutsideEvent` in workflow plugin
- Removed deprecated `onComplete` parameter from document action hooks in workflow plugin
- Removed deprecated `mode` prop from Badge component in workflow plugin

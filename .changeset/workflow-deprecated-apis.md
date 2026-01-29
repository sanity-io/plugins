---
"sanity-plugin-workflow": patch
---

Replace deprecated Sanity UI hooks and remove deprecated props

- Replaced deprecated `useTimeAgo` hook with `useRelativeTime`
- Replaced deprecated `useClickOutside` hook with `useClickOutsideEvent`
- Removed deprecated `onComplete` parameter from document action hooks
- Removed deprecated `mode` prop from Badge component
- Migrated from deprecated theme v0 APIs to v2 APIs using `getTheme_v2` helper

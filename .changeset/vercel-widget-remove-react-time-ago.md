---
'sanity-plugin-dashboard-widget-vercel': patch
---

Remove the `react-time-ago` dependency. The deployment age now uses Sanity Studio's `useRelativeTime`, so it follows the Studio's locale and reads like other relative times in the Studio (for example "5 min" instead of "5m").

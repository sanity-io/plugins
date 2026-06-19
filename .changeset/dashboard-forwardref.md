---
"@sanity/dashboard": patch
---

Replace `React.forwardRef` with the React 19 ref-as-prop pattern. `DashboardWidgetContainer` is now a plain function component; it still accepts a `ref` as before.

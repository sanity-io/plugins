---
'sanity-plugin-dashboard-widget-vercel': patch
---

Remove the `object-hash` dependency. Deployment queries are now keyed by the deployment target's fields directly, and the Vercel token is no longer part of the query key.

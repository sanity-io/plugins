---
'sanity-plugin-utils': patch
---

Fix `useListeningQuery` breaking when its listener fails. It no longer throws "You provided an invalid object where a stream was expected", keeps the last `data` instead of resetting it to `null`, and reconnects with backoff (2s, doubling up to 30s). `error` is set while it reconnects, and cleared once results arrive again. Errors that would fail the same way again, like a query parse error, are reported without reconnecting.

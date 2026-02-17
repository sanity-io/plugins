---
"@sanity/studio-secrets": patch
---

Fixed SSE listener leak in `useSecrets` hook. Previously, every component using `useSecrets` created its own SSE listener connection, causing connections to accumulate over a session (observed: 11 connections where 1 is sufficient). The hook now deduplicates listeners using RxJS `share()` so all components subscribing to the same namespace share a single SSE connection. Also fixes a race condition where a slow initial fetch could overwrite a newer value delivered by the SSE listener.

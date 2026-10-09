---
'@sanity/studio-secrets': patch
---

Update `react-rx` to v7. `useSecrets` now reads the secrets document with `useSyncObservable`, so `loading` and `secrets` stay in sync with the store and with the namespace passed to the hook. The first render always reports `loading: true`; the document is observed once the component mounts, so a document that is already available resolves right after the first paint instead of during it. `react-rx` v7 requires React `^19.2` (already required) and declares Node `>=22.12`.

---
'sanity-plugin-bynder-input': minor
---

Add `persistRawFields` option to opt out of persisting the full raw Bynder asset payload. Available both on `bynderInputPlugin({...})` as a Studio-wide default and on a `bynder.asset` field's `options` as a per-field override. Defaults to `true` so existing documents and behavior are unchanged.

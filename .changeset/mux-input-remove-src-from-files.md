---
"sanity-plugin-mux-input": patch
---

Remove `src` from the published `files` array. Only the compiled `dist` output (plus v2-compatibility files) is published; the `source`/`development` export conditions that referenced `src` are already stripped from the published package via `publishConfig.exports`.

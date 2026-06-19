---
"sanity-plugin-media": patch
---

Remove `src` from the published `files` array; only the compiled `dist` output is published. The `source`/`development` export conditions that referenced `src` are already stripped from the published package via `publishConfig.exports`.

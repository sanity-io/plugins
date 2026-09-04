---
"sanity-plugin-iframe-pane": patch
---

Stop serializing the whole document with `JSON.stringify` on every document change to detect draft-snapshot updates; compare with `dequal/lite` instead. The check runs per keystroke while the pane is open and now short-circuits on the first differing field (typically `_rev`) instead of stringifying both documents twice.

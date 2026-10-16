---
'@sanity/code-input': patch
---

Fix inline code previews overflowing the surrounding text in portable text. The inline label shows the first line of code, capped at 20 characters, and falls back to the language or UNKNOWN when that line is empty.

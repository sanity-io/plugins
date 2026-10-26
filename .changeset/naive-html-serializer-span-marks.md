---
'sanity-naive-html-serializer': patch
---

Preserve span mark definitions, including links without an href, when converting portable text to HTML and back. An edited anchor href in the HTML replaces the stored link URL.

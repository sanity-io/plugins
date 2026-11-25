---
'sanity-plugin-media': patch
---

Remove the `copy-to-clipboard` dependency. "Copy URL" now uses the browser Clipboard API, and only shows "Copied!" once the URL is actually on the clipboard.

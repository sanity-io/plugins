---
"@sanity/assist": patch
---

Create a real draft before AI Assist writes when the document was just published. Generate image description, translate document, and translate fields no longer fail or overwrite published content by targeting `drafts.<id>` while only a virtual draft exists.
Fixes [#660](https://github.com/sanity-io/plugins/issues/#660) [#663](https://github.com/sanity-io/plugins/issues/#663) [#666](https://github.com/sanity-io/plugins/issues/#666) [#667](https://github.com/sanity-io/plugins/issues/#667)

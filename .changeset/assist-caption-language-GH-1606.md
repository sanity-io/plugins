---
"@sanity/assist": patch
---

Include the document's language field path (`translate.document.languageField`) in image description/caption generation requests, the same way it's already sent for document translation. This is forward-compatible plumbing for [sanity-io/plugins#1606](https://github.com/sanity-io/plugins/issues/1606); note that the current AI Assist backend for "Generate image description" still always writes descriptions in English regardless of this field, which is a known backend limitation (see the README for the recommended Transform Agent Action workaround if you need non-English alt text today).

---
"@sanity/assist": patch
---

Create a real draft before AI Assist writes when the document was just published. Generate image description and other assist writes no longer fail by patching `drafts.<id>` while only a virtual draft exists.

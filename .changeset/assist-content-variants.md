---
"@sanity/assist": major
---

Adds support for the upcoming Content Variants beta. Instructions, translations, image captions, and custom field actions now target the variant document shown in the pane. Actions are unavailable while a document has no version in the selected variant.

`documentIdForAction` on custom field actions is now `string | undefined` until the target document is ready. Guard custom actions with that id before calling agent APIs.

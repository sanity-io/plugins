---
"@sanity/assist": major
---

Requires `sanity` 6.13.0 or newer (`targetDocumentState`). Sanity Studio 5, and 6.0 to 6.12, are no longer supported.

Adds support for the upcoming Content Variants beta. Instructions, translations, image captions, and custom field actions now target the variant document shown in the pane. Actions are unavailable while a document has no version in the selected variant.

`documentIdForAction` on custom field actions is now `string | undefined` until the target document is ready. Guard custom actions with that id before calling agent APIs.

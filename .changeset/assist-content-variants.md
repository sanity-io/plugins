---
"@sanity/assist": patch
---

Run instructions on the selected content variant. Instructions, translations, image captions and custom field actions now target the variant document shown in the pane. When only the published variant sibling exists, Assist materializes the advertised draft variant (the same empty form `onChange` used after publish) before writing. Actions are unavailable while a document has no version in the selected variant.

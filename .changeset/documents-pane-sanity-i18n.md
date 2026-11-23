---
'sanity-plugin-documents-pane': major
---

Support Sanity Studio v7, which only exports the i18n runtime (`useTranslation`, …) from `sanity/i18n`. The plugin now imports it from there, so it requires `sanity` `^6.25.0` (the first v6 release with `sanity/i18n`) or `^7`. Studios on v5 or on v6 before 6.25.0 should stay on v4 of this plugin.

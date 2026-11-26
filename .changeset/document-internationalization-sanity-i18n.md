---
'@sanity/document-internationalization': major
---

Support Sanity Studio v7: import the i18n runtime from `sanity/i18n`, and import document, preview and form helpers from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`useSchema` and `TextWithTone` from its `/1` subpath). Requires `sanity` `^6.25.0` or `^7`. Studios on earlier versions should stay on v6 of this plugin.

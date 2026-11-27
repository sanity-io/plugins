---
'sanity-plugin-documents-pane': major
---

Support Sanity Studio v7: import the i18n runtime from `sanity/i18n`, and import document and pane helpers from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`usePaneRouter` from its `/structure` subpath). Requires `sanity` `^7` (the private-internals `/structure` subpath is not on Studio 6.x). Studios on earlier versions should stay on v4 of this plugin.

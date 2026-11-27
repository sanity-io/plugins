---
'sanity-plugin-media': major
---

Support Sanity Studio v7 by importing form, diff, preview and document helpers from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (the public `sanity` export no longer provides them). `useSchema`, `TextWithTone` and `useDocumentPane` come from its `-1` sibling entry, pane-router helpers from its `-structure` entry, and form, diff and presence components from its `-2` entry, which the plugin loads only when a lazily loaded input, tool or document component needs it. Requires `sanity` `^6.17.0` or `^7`. Studios on earlier versions should stay on the previous major of this plugin.

---
'@sanity/assist': major
'@sanity/block-insert-picker': major
'@sanity/code-input': major
'@sanity/cross-dataset-duplicator': major
'@sanity/dashboard': major
'@sanity/embeddings-index-ui': major
'@sanity/google-maps-input': major
'@sanity/hierarchical-document-list': major
'@sanity/language-filter': major
'@sanity/orderable-document-list': major
'@sanity/personalization-plugin': major
'@sanity/presets': major
'@sanity/rich-date-input': major
'@sanity/studio-secrets': major
'@sanity/themer': major
'sanity-plugin-aprimo': major
'sanity-plugin-bynder-input': major
'sanity-plugin-cloudinary': major
'sanity-plugin-dashboard-widget-document-list': major
'sanity-plugin-dashboard-widget-vercel': major
'sanity-plugin-google-translate': major
'sanity-plugin-graph-view': major
'sanity-plugin-hotspot-array': major
'sanity-plugin-iframe-pane': major
'sanity-plugin-internationalized-array': major
'sanity-plugin-markdown': major
'sanity-plugin-media': major
'sanity-plugin-mux-input': major
'sanity-plugin-shopify-assets': major
'sanity-plugin-utils': major
'sanity-plugin-workflow': major
'sanity-plugin-workspace-home': major
'sanity-translations-tab': major
---

Support Sanity Studio v7 by importing form, diff, preview and document helpers from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (the public `sanity` export no longer provides them). `useSchema` and `TextWithTone` come from that entry's `/1` subpath, and pane-router helpers come from its `/structure` subpath. Requires `sanity` `^7` (those nested subpaths are not on Studio 6.x). Studios on earlier versions should stay on the previous major of this plugin.

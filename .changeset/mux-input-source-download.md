---
'sanity-plugin-mux-input': minor
---

author: @y-dpi

Add a "Download" action to retrieve the original source video/audio file of a Mux asset

A new "Download" entry is available in the player actions menu and in the asset details dialog. It uses Mux's `master_access` feature to prepare the full-quality source file before transcoding and then downloads it with the asset's name and original extension.

Note: preparing the source file requires the Mux addon `master-access` endpoint, which is not yet exposed. Until it is available, override `updateMasterAccess` to point at your own Mux API proxy to complete the flow.

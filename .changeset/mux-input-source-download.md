---
"sanity-plugin-mux-input": minor
---

author: @y-dpi
author: @R-Delfino95

Add a "Mezzanine" action to enable and download a Mux asset's master-access file

A new "Mezzanine" section is available in the asset details dialog (next to Captions) and in the player actions menu. It lets editors enable Mux's master access — the highest-quality, near-lossless source copy of the asset, meant for offline editing and archival rather than streaming (unlike the streamable MP4 static renditions). The same surface explains what it is (free, available for 24 hours) and lets the user enable, watch it prepare, and download it, and links to Mux's guide — there's no separate confirmation dialog.

Enabling and status checks go through the Mux addon proxy (the same authentication as every other addon call), and the resulting `master` data is stored on the Sanity document — so the status is polled until ready (like captions) and is already present for assets imported from Mux. Because the Mux download URL is short-lived, the Download action re-fetches the asset first: if the file is still available it redirects to it, otherwise it prompts to enable it again.

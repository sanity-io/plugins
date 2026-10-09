---
'sanity-plugin-mux-input': patch
---

The Studio player picks up new caption and audio tracks without a page refresh, and a signed video no longer reloads when an unrelated field of its document changes. A video without playback IDs can get a new one from its player instead of showing a bare error, and resyncing a video now also points `playbackId` at a playback ID the asset still has.

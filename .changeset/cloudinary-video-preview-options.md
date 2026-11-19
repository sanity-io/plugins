---
'sanity-plugin-cloudinary': minor
---

Add an opt-in `videoPreview` option to `cloudinarySchemaPlugin` and `cloudinaryReferencePlugin` to cut the bandwidth of video previews in the Studio. `transformation` plays a transformed copy (for example `'q_auto,w_640'`) instead of the original and falls back to the original if Cloudinary rejects it, `preload: 'none'` loads nothing until the editor presses play, and `poster: true` shows a still of the first frame. Nothing changes unless you set these options.

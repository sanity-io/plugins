---
"sanity-plugin-media": patch
---

Manage the state of the media browser with XState instead of Redux, which removes the `@reduxjs/toolkit`, `react-redux`, `redux` and `redux-observable` dependencies. Components now only re-render when the state they show changes: picking an asset re-renders its own card instead of the whole grid.

This also fixes a few issues:

- Uploads no longer stay in progress when a file can't be hashed or when checking the uploaded asset fails, and preview URLs of cancelled uploads are released
- Renaming a tag updates tag filters without reloading the assets, and tags stay sorted by name after being created or renamed
- If tags fail to load in a field with `mediaTags`, the browser shows every asset and an error, instead of never loading any assets
- The tags and folders panels reappear when the window grows again after being narrow
- Reopening a create or rename dialog no longer shows the error of an earlier attempt
- Tags that finish loading after the asset edit dialog opened now show up in it, instead of being removed when saving
- Changes made elsewhere to an asset that is open in the edit dialog no longer discard your unsaved edits
- Buttons in dialogs no longer occasionally ignore clicks

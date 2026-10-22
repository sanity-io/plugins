---
'sanity-plugin-media': patch
---

Manage the state of the media browser with XState instead of Redux, which removes the `@reduxjs/toolkit`, `react-redux`, `redux` and `redux-observable` dependencies. Components now only re-render when the state they show changes: picking an asset re-renders its own card instead of the whole grid.

This also fixes a few issues:

- Uploads no longer stay in progress when a file can't be hashed or when checking the uploaded asset fails, and preview URLs of cancelled uploads are released
- Renaming a tag updates tag filters without reloading the assets, and tags stay sorted by name after being created or renamed
- If tags fail to load in a field with `mediaTags`, the browser shows every asset and an error, instead of never loading any assets
- The tags and folders panels reappear when the window grows again after being narrow
- Reopening a create or rename dialog no longer shows the error of an earlier attempt
- Saving asset details no longer removes tags you didn't remove, such as tags that were still loading or failed to load. The tags field waits for tags to load before it can be edited, and tags that finish loading after the edit dialog opened now show up in it
- Changes made elsewhere to an asset that is open in the edit dialog no longer discard your unsaved edits
- The edit dialog no longer says an asset's folder no longer exists while folders are loading, and tells when folders couldn't be loaded
- Failing to load folders, move assets, or add or remove a tag now shows an error, and the folders panel offers to retry instead of showing "No folders"
- Tags added to or removed from assets show up right away, instead of after a short delay during which saving the asset's details could undo them
- Moving assets or removing tags from them no longer overwrites changes made to those assets elsewhere in the meantime
- Uploads no longer show up in a folder or search they don't match when you switch folders or search while they are being processed
- Loading more assets after deleting some no longer loads the wrong page

---
"sanity-plugin-media": minor
---

author: @bobbygeo
author: @pedrobonamin

Add folder management to the media browser

- Organise assets into nested folders, backed by a new `media.folder` document type (a `name` plus a weak `parent` reference) and a single weak `opt.media.folder` reference on each asset (mirroring how tags work). Renaming a folder is a one-field document write regardless of how many assets it contains.
- Browse folders in a dedicated sidebar tree, with breadcrumb navigation, create / rename / delete flows, a bulk "Move to folder" dialog, and per-asset folder controls in the asset details dialog. The default "All assets" view lists every asset; opening a folder filters the list to that folder.
- Deleting a folder removes only the folder document — its assets stay in the library with their folder assignment cleared, and nested folders move up one level.
- Support multi-select insert when the media plugin is used as an asset source for array (multiple) fields.

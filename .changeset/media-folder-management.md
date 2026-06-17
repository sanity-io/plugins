---
'sanity-plugin-media': minor
---

author: @bobbygeo

Add folder management to the media browser

- Organise assets into nested folders, backed by a new `media.folder` document type and a single weak `opt.media.folder` reference on each asset (mirroring how tags work). Renaming and moving a folder are one-field document writes regardless of how many assets they contain.
- Browse folders in a dedicated sidebar with breadcrumb navigation, plus create / rename / move / recursive-delete flows and a bulk "Move to folder" dialog. The default "Home" view lists assets that aren't assigned to a folder.
- Support multi-select insert when the media plugin is used as an asset source for array (multiple) fields.

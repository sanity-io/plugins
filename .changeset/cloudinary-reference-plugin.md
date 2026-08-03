---
'sanity-plugin-cloudinary': minor
---

author: @pgurley
author: @atlvis

Add `cloudinaryReferencePlugin` for storing Cloudinary assets as reusable document references

- New `cloudinaryReferencePlugin` registers the schema types needed to reference Cloudinary assets as documents
- New `cloudinaryAssetDocument` type stores a Cloudinary asset as a standalone document
- New `cloudinaryAssetReference` type references those asset documents, with a custom input for selecting and managing assets through the Cloudinary Media Library
- `openMediaSelector` now supports a `showHandler` callback and a `folder` option, so the select button can show a loading state and scope the library to a folder
- Fixed the internal name of `cloudinaryAssetSourcePlugin` (`cloudinart-asset-source` → `cloudinary-asset-source`)

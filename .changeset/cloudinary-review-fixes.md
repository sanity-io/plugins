---
'sanity-plugin-cloudinary': patch
---

- Fix the `cloudinaryAssetSourcePlugin` name, which was mistakenly registered as `cloudinart-asset-source`
- Wait for the Cloudinary Media Library script to finish loading before opening it, avoiding runtime errors when several inputs mount at once
- Fix a user-facing typo in the asset source loading message ("Media Libary" → "Media Library")
- Remove an invalid `src`-less `<track>` element from the video preview
- Correct the README usage examples (`defineConfg` → `defineConfig`) and drop stale standalone-repo "Develop & test" / "Release new version" instructions

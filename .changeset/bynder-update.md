---
'sanity-plugin-bynder-input': patch
---

Update @bynder/compact-view to v5.2.3 and remove patch dependency

The patch is no longer needed as the new version natively includes react/jsx-runtime imports. The build script was updated to remove the --strict flag to accommodate bundled dependencies in @bynder/compact-view.

---
'sanity-plugin-bynder-input': patch
---

Update @bynder/compact-view to v5.2.3 with package.json patch

The new version natively includes react/jsx-runtime imports, eliminating the need for the previous jsx-runtime patch. However, a new patch is needed to update the package.json peer dependencies to allow React 19 (changed from `<19.0.0` to `<20.0.0`). The build script was updated to remove the --strict flag to accommodate bundled dependencies in @bynder/compact-view.

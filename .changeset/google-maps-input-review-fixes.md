---
'@sanity/google-maps-input': patch
---

Fix review feedback for the monorepo port:

- The `GeopointInput`/`GeopointRadiusInput` components now use the config passed via props instead of a global, so they behave correctly when used directly.
- Clean up Google Maps event listeners on unmount (marker click handler, search autocomplete and the editable radius circle) to prevent listener leaks when dialogs are opened and closed repeatedly.
- Move the radius circle/marker setup out of render into effects, and keep the marker drag tracking reliable.
- Keep the marker draggable state in sync when the `onMove` handler changes.
- Avoid runtime errors when previewing incomplete `geopointRadius` documents.
- Render the "failed to load" error message and authentication hints as valid, accessible markup with a stable fallback.
- Tidy up the README and internal types.

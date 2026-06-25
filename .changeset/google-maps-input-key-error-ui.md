---
"@sanity/google-maps-input": major
---

Modernize the map input by rebuilding it on [`@vis.gl/react-google-maps`](https://visgl.github.io/react-google-maps/), improve the key-configuration UX, and implement Review Changes diffs.

- The map now loads via `<APIProvider>` (with `loading=async`) and uses the library's components: a default advanced marker, `StaticMap`/`createStaticMapsUrl` for the location preview, and an editable `<Circle>` for the radius.
- Place search now uses the new `gmp-place-autocomplete` web component backed by the **Places API (New)**, replacing the legacy `google.maps.places.Autocomplete` widget — giving better autocomplete results and a nicer search UX.
- This refactors away from deprecated Google Maps APIs, resolving the runtime console deprecation warnings for:
  - `google.maps.Marker` → `google.maps.marker.AdvancedMarkerElement`
  - `google.maps.places.Autocomplete` → `google.maps.places.PlaceAutocompleteElement`
  - loading the Maps JavaScript API without `loading=async`
- Implemented the Review Changes diff: `geopoint` and `geopointRadius` changes now render a before/after static map preview (matching the built-in image diff) instead of raw latitude/longitude/radius field diffs. `geopointRadius` wires this automatically; for the built-in `geopoint` type, attach the exported `GeopointDiff` to your field's `components.diff`.
- The radius preview now auto-fits the viewport so the whole circle stays within the image instead of being clipped.
- A missing key renders a clear warning card (how to add `apiKey` to the plugin config and which Google APIs it needs); a rejected key replaces the map/preview with an actionable error card noting the key may be invalid, a demo key, or restricted, and listing the required APIs (Google Maps JavaScript API, Google Static Maps API, Google Places API (New)).
- **Breaking:** removes the previously exported (but non-functional) `GeopointFieldDiff`, `GeopointArrayDiff`, and `GeopointRadiusFieldDiff` components (and their prop types), replaced by the single `GeopointDiff`.

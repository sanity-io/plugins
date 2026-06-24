---
"@sanity/google-maps-input": minor
---

Modernize the map input by rebuilding it on [`@vis.gl/react-google-maps`](https://visgl.github.io/react-google-maps/), and improve the key-configuration UX.

- The map now loads via `<APIProvider>` (with `loading=async`) and uses the library's components: a default advanced marker, `StaticMap`/`createStaticMapsUrl` for the location preview, an editable `<Circle>` for the radius, and the `gmp-place-autocomplete` web component (Places API New) for place search.
- This refactors away from deprecated Google Maps APIs, resolving the runtime console deprecation warnings for:
  - `google.maps.Marker` → `google.maps.marker.AdvancedMarkerElement`
  - `google.maps.places.Autocomplete` → `google.maps.places.PlaceAutocompleteElement`
  - loading the Maps JavaScript API without `loading=async`
- A missing key renders a clear warning card (how to add `apiKey` to the plugin config and which Google APIs it needs); a rejected key replaces the map/preview with an actionable error card noting the key may be invalid, a demo key, or restricted, and listing the required APIs (Google Maps JavaScript API, Google Static Maps API, Google Places API (New)).
- Removed the previously unimplemented diff component exports (`GeopointFieldDiff`, `GeopointArrayDiff`, `GeopointRadiusFieldDiff`), and `@types/google.maps` no longer needs to be installed separately — its types are provided by `@vis.gl/react-google-maps`.

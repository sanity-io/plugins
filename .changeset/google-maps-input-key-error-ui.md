---
"@sanity/google-maps-input": major
---

Rebuild the map rendering on [`@vis.gl/react-google-maps`](https://visgl.github.io/react-google-maps/) and improve the key-configuration UX.

- The custom Maps JavaScript API loader is replaced with `<APIProvider>`; markers are now advanced markers, the location preview uses the library's `StaticMap`/`createStaticMapsUrl`, the radius is an editable `<Circle>`, and place search uses the `gmp-place-autocomplete` web component (Places API New).
- A missing key renders a clear warning card (how to add `apiKey` to the plugin config and which Google APIs it needs); a rejected key replaces the map/preview with an actionable error card noting the key may be invalid, a demo key, or restricted, and listing the required APIs (Google Maps JavaScript API, Google Static Maps API, Google Places API (New)).

**Breaking changes:**

- The (previously unimplemented) diff components — `GeopointFieldDiff`, `GeopointArrayDiff`, `GeopointRadiusFieldDiff` and their prop types — have been removed.
- `@types/google.maps` no longer needs to be installed separately; its types are provided by `@vis.gl/react-google-maps`.

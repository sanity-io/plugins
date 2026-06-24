---
"@sanity/google-maps-input": patch
---

Improve the UI shown when the Google Maps API key is missing or invalid. A missing key now renders a clear warning card explaining how to add the `apiKey` to the `googleMapsInput` plugin config and which Google APIs it needs, instead of plain unstyled text. If a configured key is rejected, the static map preview is replaced with an error card explaining that the key may be invalid, a demo key, or restricted, and listing the required APIs (Google Maps JavaScript API, Google Static Maps API, Google Places API (New)).

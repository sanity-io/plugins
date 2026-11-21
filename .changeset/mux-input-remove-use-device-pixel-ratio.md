---
'sanity-plugin-mux-input': patch
---

Remove the `use-device-pixel-ratio` dependency. The thumbnail dialog reads `devicePixelRatio` directly, rounded down and capped at 2 as before.

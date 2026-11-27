---
'@sanity/google-maps-input': major
'sanity-plugin-aprimo': major
'sanity-plugin-bynder-input': major
'sanity-plugin-hotspot-array': major
'sanity-plugin-markdown': major
---

The input and diff components this plugin exports are now `React.lazy` components, so they load the Studio's form internals on demand. Inside the Studio form they work as before; when rendering them elsewhere, wrap them in a `Suspense` boundary.

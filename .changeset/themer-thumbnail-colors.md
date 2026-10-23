---
'@sanity/themer': patch
---

Render the theme thumbnails from the handful of colors they paint, instead of building a whole Sanity UI theme and two `ThemeProvider`s per thumbnail, so the theme list renders much faster when the navbar button prerenders it

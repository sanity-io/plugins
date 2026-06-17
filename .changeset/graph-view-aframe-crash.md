---
'sanity-plugin-graph-view': patch
---

Fix crash on load by importing `ForceGraph2D` from `react-force-graph-2d` instead of the umbrella `react-force-graph` package, which pulled in VR/AR builds that reference an undefined global `AFRAME`

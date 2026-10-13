---
'sanity-plugin-graph-view': patch
---

Keep the graph where it was when the Studio shows the Graph tool again after hiding it as a recently used tool (`beta.reactActivityMode`): the documents, the live listener and the canvas (with its zoom and node positions) now live for as long as the tool is mounted, so returning to it no longer refetches every document and lays the graph out from scratch. The simulation only pauses while the tool is hidden. The graph is now drawn with `force-graph` directly instead of through `react-force-graph-2d`.

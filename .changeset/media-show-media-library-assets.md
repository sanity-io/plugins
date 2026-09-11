---
"sanity-plugin-media": minor
---

Add `showMediaLibraryAssets` option (default `true`). When set to `false`, assets managed by the Sanity Media Library are excluded from the Media browser grid, asset picker queries, folder counts and realtime listeners. Media Library assets are detected by their `media` reference (`media-library:...`) — the reliable signal — with `source.name` (`sanity-media-library`) as an optional confirmation, so links that omit the optional `source` field are still excluded.

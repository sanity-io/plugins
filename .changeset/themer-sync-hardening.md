---
'@sanity/themer': patch
---

Syncing themes across the Studio's tabs is sturdier: a tab the browser puts in its back/forward cache hands the persisting on and catches up as it comes back — from the other tabs, or from what the last one wrote when none is left — without passing its frozen state off as the newest, an answer heard out of order no longer undoes newer state, malformed messages are ignored, and a theme deleted or given another image in one tab lets go of the image another tab was showing for it. Themes travel between tabs as they are, so a blank title no longer differs from tab to tab. A corrupt snapshot in `localStorage` no longer hides what earlier versions stored.

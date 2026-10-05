---
'@sanity/themer': patch
---

Syncing themes across the Studio's tabs is sturdier: a tab the browser puts in its back/forward cache hands the persisting on and catches up as it comes back, an answer heard out of order no longer undoes newer state, malformed messages are ignored, and a theme deleted or given another image in one tab lets go of the image another tab was showing for it. Themes travel between tabs as they are, so a blank title no longer differs from tab to tab. A corrupt snapshot in `localStorage` no longer hides what earlier versions stored, and the background behind the split preview's transitions is the applied theme's, also when it only sets an accent.

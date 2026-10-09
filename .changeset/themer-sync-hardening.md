---
'@sanity/themer': patch
---

Syncing themes across tabs is sturdier:

- A tab back from the back/forward cache catches up on what changed, from the other tabs or from `localStorage` when none is left, instead of pushing its stale state onto them.
- A late answer to a tab's hello no longer undoes newer changes.
- Malformed messages on the channel are ignored.
- Deleting a theme, or giving it a new image, in one tab frees the old image in the other tabs.
- Titles arrive in the other tabs as typed, so a blank title no longer differs from tab to tab.
- A corrupt snapshot in `localStorage` no longer hides what earlier versions stored.

Picking themes in a row works: the sidebar stays clickable while the Studio cross-fades to the picked theme, so a click during the fade is no longer dropped. The sidebar's own colors switch at once instead of fading along.

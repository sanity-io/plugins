---
'@sanity/themer': minor
---

Your themes stay the same across the Studio's tabs: a theme picked, edited, added or removed in one tab shows in the others right away, while which tab has the sidebar open, or the split preview on, stays each tab's own. The tool picks up where you left off after a reload, and what it keeps in `localStorage` is validated as it is read back — what earlier versions stored is migrated — and written from one tab at a time.

The sidebar's footers follow the Studio's document footer: one primary action — `Edit` for your own applied theme, `Duplicate & Edit` for a preset or the configured theme, `Done` in the editor and among the removed themes — with the other actions (adding a theme, from an image or from a shared code, the applied theme's code, removing the theme being edited) behind the menu button next to it. The header keeps the split preview toggle and the close button.

`themerTool` takes a `title` option — what the tool goes by in the navbar toggle's label and tooltip, `Themer` by default. On small screens the sidebar stays closed for now, and the navbar toggle stays away, until a mobile layout returns. The navbar toggle's color wheel keeps still with `prefers-reduced-motion: reduce`.

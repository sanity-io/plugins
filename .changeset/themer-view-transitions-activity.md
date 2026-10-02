---
'@sanity/themer': minor
---

The themer tool's motions now run on React's `<ViewTransition>` and `<Activity>` (React 19.3): the sidebar sliding in and out, the split preview's second Studio coming and going, and a picked theme cross-fading in are each a transition type the layout tags as it starts them, which the stylesheet keys on — so the Studio's own transitions never animate the themer, and `prefers-reduced-motion: reduce` turns the themer's animations off in CSS. The sidebar and the split copy stay mounted while hidden, so reopening them is instant, and moving the pointer onto the navbar toggle prerenders the sidebar ahead of the transition; pressed before it has loaded, the toggle's color wheel laps until it has. Userland `<ViewTransition>`s can take part in the themer's motions through the `sanity-themer` transition type, e.g. `update={{'sanity-themer': 'auto', default: 'none'}}`.

`themerTool` takes a new `title` option — what the tool goes by in the navbar toggle's label and tooltip, `Themer` by default.

Your themes stay the same across the Studio's tabs: a theme picked, edited, added or removed in one tab shows in the others right away, while which tab has the sidebar open, or the split preview on, stays each tab's own. The tool picks up where you left off after a reload, and what it keeps in `localStorage` is validated as it is read back — what earlier versions stored is migrated — and written from one tab at a time.

On small screens the sidebar stays closed for now — the layout that covered the Studio and stacked the split preview is gone until a mobile layout returns.

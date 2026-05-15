---
"sanity-plugin-workflow": patch
---

Fix drag-and-drop item positioning issue in workflow columns

Workflow items would drop one position off from where they were visually placed when dragging within the same column. This was caused by the dragged item remaining in the destination items array during rank calculation.

**Changes:**

- Filter out the dragged item when reordering within the same column, aligning with dnd library expectations
- Fix boundary check for end-of-list drops to correctly identify when dropping at or past the last position

---
'@sanity/table': patch
---

Fix table preview cell truncation (use the `ellipsis` text-overflow), derive the menu/dialog DOM ids from the input id so multiple table inputs (e.g. arrays of tables) don't collide on duplicate ids, and validate the add row/column count by disabling Confirm and showing a validity message for empty or out-of-range values

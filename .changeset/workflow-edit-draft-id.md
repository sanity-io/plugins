---
'sanity-plugin-workflow': patch
---

Fix the workflow Edit button crashing Studio on unpublished documents. Draft and version ids are opened with their published id, so the structure tool no longer throws "editOpsOf does not expect a draft id."

---
'@sanity/assist': patch
---

Keep the document's selected field group from resetting while editing AI Assist instructions. The instruction inspector no longer overwrites the host document pane's `path` param, so working with AI Assist inputs preserves the active field group tab.

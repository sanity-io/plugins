---
'sanity-plugin-mux-input': patch
---

Update `react-rx` to v7. The document list preview now renders its loading placeholder on the first paint and subscribes to the preview state once mounted, matching the Studio's own pane item preview. `react-rx` v7 requires React `^19.2` (already required) and declares Node `>=22.12`.

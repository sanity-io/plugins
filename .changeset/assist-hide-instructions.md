---
"@sanity/assist": minor
---

Add `hideInstructions` option to hide the instructions UI from AI Assist field action menus while keeping translation, image, and custom actions available. Supports both plugin-level (`assist({ hideInstructions: true })`) and field-level (`options.aiAssist.hideInstructions`) configuration, with field-level settings overriding the plugin-level default.

---
"@sanity/assist": minor
---

author: @kevindice

Add `assist.maxFieldSelectionDepth` to configure how deeply nested a field can be and still get AI Assist: the field action (sparkle button), the field picker in the instruction editor and field references in instructions. This depth was hardcoded to 6 path segments, so deeper fields silently disappeared from AI Assist and neither `assist.maxPathDepth` nor `translate.field.maxPathDepth` could change that. The default is still 6, so nothing changes unless the option is set.

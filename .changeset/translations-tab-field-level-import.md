---
'sanity-translations-tab': patch
---

Fix field-level imports writing nothing: unless `mergeWithTargetLocale` was set, `fieldLevelPatch` looked up the translated values under the target locale instead of the base language they are keyed by, so every import committed an empty patch.

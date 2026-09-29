---
"@sanity/plugin-kit": patch
---

Require oxlint ^1.86.0, and ban `export *` barrel files that load over 100 modules (`oxc/no-barrel-file`) and the `styled-components` default import in the shared oxlint config

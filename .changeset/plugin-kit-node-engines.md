---
"@sanity/plugin-kit": patch
---

`verify-package` now describes the required `engines.node` range as matching `sanity` (tracking the lowest supported Studio major, currently v5) rather than `@sanity/pkg-utils`. The required range is unchanged (`>=20.19 <22 || >=22.12`).

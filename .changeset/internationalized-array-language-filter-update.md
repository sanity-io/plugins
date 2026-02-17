---
'sanity-plugin-internationalized-array': patch
---

Update to support @sanity/language-filter v4.1.0 with parentValue parameter

- Moved `@sanity/language-filter` from dependencies to devDependencies as `workspace:^`
- Added `@sanity/language-filter` v4.1.0+ as a peer dependency
- Updated `filterField` call to include the new fourth parameter (parentValue) for better filtering capabilities

---
'sanity-plugin-media': patch
---

Remove the direct `redux` dependency. The only use was a type import, which now comes from `@reduxjs/toolkit`.

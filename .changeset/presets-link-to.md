---
"@sanity/presets": minor
---

Rename `link.internalTypes` to `link.to`, aligning with the Schema API's `reference.to`. The `to` option now accepts both string shorthand (`['page', 'post']`) and the object form (`[{type: 'page'}]`) used natively by `reference.to`.

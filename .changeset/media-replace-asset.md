---
"sanity-plugin-media": minor
---

author: @Polleke007
author: @joepvandepol

Add the ability to replace a selected asset with another one and update all of its references across documents

When a single asset is selected, a new **Replace** action opens an overview where you can pick a replacement asset. Every document that references the original asset (including deeply nested image fields) is re-pointed to the chosen asset. Ported from sanity-io/sanity-plugin-media#236.

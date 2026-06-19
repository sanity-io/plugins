---
"sanity-plugin-media": major
---

Drop the CommonJS build and require Sanity Studio v5 or v6

The plugin is now published as ESM only and no longer ships a CommonJS (`require`) build. The `sanity` peer dependency is also tightened to `^5 || ^6.0.0-0`, dropping declared support for Studio v3 and v4. Sanity Studio v5+ is pure ESM and the supported Node.js versions handle `require(esm)`, so a separate CommonJS build is no longer needed and only risks two copies of the code ending up in the module tree.

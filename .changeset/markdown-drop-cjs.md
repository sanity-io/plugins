---
"sanity-plugin-markdown": major
---

Drop the CommonJS build and publish ESM only

The plugin is now published as ESM only and no longer ships a CommonJS (`require`) build. Sanity Studio v5+ is pure ESM and the supported Node.js versions handle `require(esm)`, so a separate CommonJS build is no longer needed and only risks two copies of the code ending up in the module tree.

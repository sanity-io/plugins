---
'@sanity/plugin-kit': patch
---

The `@sanity/plugin-kit/oxfmt` preset no longer formats `.changeset/*.md` files with double quotes, so their frontmatter gets single quotes like the rest of your code. Changesets 3 formats the changesets it writes with oxfmt when it finds your `oxfmt.config.ts`, or when `.changeset/config.json` sets `"format": "oxfmt"`, so they come out the same way.

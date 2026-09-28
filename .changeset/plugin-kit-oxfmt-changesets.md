---
'@sanity/plugin-kit': patch
---

The `@sanity/plugin-kit/oxfmt` preset no longer switches `.changeset/*.md` files to double quotes. The override only kept `oxfmt` from reformatting the changesets that Changesets wrote with Prettier; set `"format": "oxfmt"` in `.changeset/config.json` to have Changesets format them with your oxfmt config instead.

---
'@sanity/plugin-kit': minor
---

Adds a shared stylelint config, exported as `@sanity/plugin-kit/stylelint`: `stylelint-config-recommended` plus `stylelint-config-css-modules`, with the one formatting rule the latter brings along turned off since formatting is oxfmt's job. Both configs are dependencies of the plugin-kit, so a plugin only installs `stylelint` and re-exports the preset from a `stylelint.config.mjs` (`.mjs`, because stylelint loads TypeScript configs through the TypeScript compiler API, which TypeScript 7 no longer ships).

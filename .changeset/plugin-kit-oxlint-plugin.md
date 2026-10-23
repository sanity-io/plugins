---
'@sanity/plugin-kit': minor
---

Adds an oxlint JS plugin, exported as `@sanity/plugin-kit/oxlint-plugin`, with the rule `plugin-kit/no-css-module-default-import`. It reports `import styles from './X.module.css'`, since Lightning CSS can only tree-shake a CSS module through `import * as styles` or named imports, and `oxlint --fix` rewrites a lone default import to the namespace import. The shared `@sanity/plugin-kit/oxlint` config loads the plugin and turns the rule on.

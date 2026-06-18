---
'@sanity/plugin-kit': patch
---

Fix CLI command name in messages, plus typos and a redundant tsconfig read

- Correct `binname` to `plugin-kit` so the `version`/`link-watch` help text and the missing-`sanity.json` error suggest the executable that is actually installed
- Remove a stray apostrophe from the `verify-package --single` fail-fast hint so it can be copy-pasted as-is
- Fix user-facing typos in CLI help and error messages ("promt" → "prompt", "exsists" → "exists", "Typescript" → "TypeScript")
- Parse the tsconfig file once in `readTSConfig` instead of reading it twice

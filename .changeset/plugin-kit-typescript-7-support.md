---
"@sanity/plugin-kit": major
---

feat: support TypeScript 7 (the Go-native compiler), require TypeScript 6 or later

**BREAKING**: the `typescript` peer dependency range is now `6.x || 7.x` — TypeScript 5.x is no longer supported. TypeScript 7 is not required yet, but 6.0 is the new minimum.

The JS compiler API (used by `verify-package` and `verify-studio` to parse `tsconfig.json`) is now always loaded from the official [`@typescript/typescript6`](https://www.npmjs.com/package/@typescript/typescript6) compat package (a regular dependency), since TypeScript 7 no longer ships it. The installed `typescript` peer no longer affects tsconfig parsing and is only used to run `tsc --build`.

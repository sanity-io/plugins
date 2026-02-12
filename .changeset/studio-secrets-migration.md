---
"@sanity/studio-secrets": major
---

Port @sanity/studio-secrets plugin to the plugins monorepo

**Breaking Changes:**
- Require React 19 and Sanity Studio v5
- Drop CJS output, ESM only
- Enable React Compiler

**Code Modernization:**
- Fixed TypeScript linting issues for strict type checking
- Fixed floating promises with proper void operator usage
- Replaced deprecated `React.FormEvent` with `ChangeEvent`
- Replaced `JSX.Element` return type with `ReactElement`
- Removed eslint-disable comments (oxlint does not require them)
- Updated `@sanity/ui` to v2

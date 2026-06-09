---
'sanity-translations-tab': major
---

Port sanity-translations-tab to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **React Compiler enabled**: The package is now built with React Compiler targeting React 19
- **ESM-only**: CommonJS support has been removed. The package now ships only ESM (previously exposed `require` via `./dist/index.js`)
- **React 19.2+ required**: Minimum React version is now 19.2 (previously `^18.3 || ^19`)
- **react-dom 19.2+ required**: Minimum `react-dom` version is now 19.2 (previously `^18.3 || ^19`)
- **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported; previously `^3 || ^4 || ^5`)
- **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously `>=14`)
- **styled-components 6.1+ required**: Unchanged peer requirement, now enforced as part of the monorepo build
- **Removed `@sanity/incompatible-plugin`**: Legacy Sanity v2 compatibility dependency dropped

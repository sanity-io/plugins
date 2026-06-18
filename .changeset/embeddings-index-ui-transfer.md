---
'@sanity/embeddings-index-ui': major
---

author: @snorrees

Port @sanity/embeddings-index-ui to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **React Compiler enabled**: The package is now built with React Compiler targeting React 19
- **ESM-only**: CommonJS support has been removed. The package now ships only ESM
- **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18 || ^19)
- **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
- **styled-components 6.1+ required**: `styled-components` is now a required peer dependency
- **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
- **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)
- **Dropped Sanity v2 compatibility**: Removed `v2-incompatible.js` and `sanity.json`

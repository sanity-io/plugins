---
'sanity-plugin-google-translate': major
---

Port sanity-plugin-google-translate to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **React Compiler enabled**: The plugin is now optimized with React Compiler targeting React 19
- **ESM-only**: CommonJS support has been removed. The package now ships only ESM
- **React 19.2+ required**: Minimum React version is now 19.2
- **Sanity Studio v5+ required**: Minimum Sanity version is now v5
- **Node.js 20.19+ required**: Minimum Node.js version is now 20.19
- **styled-components 6.1+ required**: Peer dependency on styled-components ^6.1

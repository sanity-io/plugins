---
'sanity-plugin-documents-pane': major
---

Port sanity-plugin-documents-pane to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **React Compiler enabled**: The package is now built with React Compiler targeting React 19
- **ESM-only**: CommonJS support has been removed. The package now ships only ESM
- **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
- **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
- **sanity-plugin-utils 2.x required**: The plugin now depends on sanity-plugin-utils v2 from the monorepo (previously ^1.7.0)
- **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)

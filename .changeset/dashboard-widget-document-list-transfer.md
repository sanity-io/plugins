---
'sanity-plugin-dashboard-widget-document-list': major
---

Port sanity-plugin-dashboard-widget-document-list to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **React Compiler enabled**: The package is now built with React Compiler targeting React 19
- **ESM-only**: CommonJS support has been removed. The package now ships only ESM
- **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
- **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
- **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
- **@sanity/dashboard v5+ required**: The `@sanity/dashboard` peer dependency range is now ^5 || ^6 (previously ^4 || ^5)
- **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)

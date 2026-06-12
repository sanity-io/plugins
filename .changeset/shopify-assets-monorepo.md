---
'sanity-plugin-shopify-assets': major
---

Port sanity-plugin-shopify-assets to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **React Compiler enabled**: The package is now built with React Compiler targeting React 19
- **ESM-only**: CommonJS support has been removed. The package now ships only ESM
- **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
- **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
- **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
- **styled-components 6.1+ required**: Minimum styled-components version is now 6.1 (previously ^6)
- **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=14)
- **Sanity v2 compatibility removed**: The legacy `sanity.json`, `v2-incompatible.js`, and `@sanity/incompatible-plugin` shims are no longer shipped
- **@sanity/ui v3**: The UI components now build against @sanity/ui v3 and the v2 theme API

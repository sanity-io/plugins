---
'@sanity/cross-dataset-duplicator': major
---

Port @sanity/cross-dataset-duplicator to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **React Compiler enabled**: The package is now built with React Compiler targeting React 19
- **ESM-only**: CommonJS support has been removed. The package now ships only ESM
- **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
- **react-dom 19.2+ required**: Minimum react-dom version is now 19.2 (previously ^18.3 || ^19)
- **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
- **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)

Other notable changes:

- Migrated to the @sanity/ui v2/v3 APIs (`gap` instead of `space`, `gridTemplateColumns` instead of `columns`, v2 theme API for dark mode detection)
- Fixed a bug in reference gathering where only the first new document `_id` was tracked as visited, which could cause redundant recursive queries
- Removed the `async` dependency in favor of a native concurrency-limited implementation

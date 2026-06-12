---
'@sanity/hierarchical-document-list': major
---

Port @sanity/hierarchical-document-list to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **react-dnd 16 compatibility fixed**: `@nosferatu500/react-sortable-tree` is upgraded to v5 and declared as a regular dependency instead of being bundled, fixing the Studio crash caused by importing the removed `DragSource`/`DropTarget` APIs from react-dnd 16
- **React Compiler enabled**: The package is now built with React Compiler targeting React 19
- **ESM-only**: CommonJS support has been removed. The package now ships only ESM
- **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
- **react-is peer dependency removed**: `react-is` is no longer required as a peer dependency
- **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
- **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=14)

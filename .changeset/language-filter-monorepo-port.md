---
'@sanity/language-filter': major
---

Port @sanity/language-filter to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **React Compiler enabled**: The plugin is now optimized with React Compiler targeting React 19
- **ESM-only**: CommonJS support has been removed. The plugin now only exports ES modules
- **Sanity Studio v5 required**: The plugin now requires Sanity Studio v5 as the minimum version
- **React 19 required**: The plugin now requires React 19.2 or later
- **Node.js 20.19+ required**: The plugin now requires Node.js 20.19 or later (or 22.12+)
- **Stricter TypeScript**: The plugin is built with `isolatedDeclarations` for better type safety
- **styled-components removed**: Removed styled-components dependency - styles now use inline styles

**Modernization:**
- Replaced deprecated `useClickOutside` hook with `useClickOutsideEvent`
- Fixed FormEvent usage with proper React.ChangeEvent
- Added explicit return type annotations for better TypeScript compatibility
- Removed styled-components

**Testing:**
- Converted from Jest to Vitest for testing
- Added package exports validation test

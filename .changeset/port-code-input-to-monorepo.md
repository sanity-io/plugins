---
'@sanity/code-input': major
---

Port @sanity/code-input to the plugins monorepo

This is a major release that migrates the plugin to the new monorepo structure with the following breaking changes:

- **Requires Sanity Studio v5**: The plugin now requires Sanity Studio v5.0.0 or later
- **Drops CommonJS support**: The plugin is now ESM-only
- **React Compiler enabled**: The plugin now uses React Compiler for optimized performance
- **Updated peer dependencies**: React 19.2+ and styled-components 6.1+ are now required

Other changes:

- Fixed React Compiler compatibility issues by properly handling dependencies in `useMemo` hooks
- Removed unused eslint-disable directives for cleaner code
- Updated build tooling to use @sanity/pkg-utils
- Improved TypeScript configuration

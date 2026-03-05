---
"@sanity/assist": major
---

Port `@sanity/assist` to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **React Compiler enabled**: The plugin is now optimized with React Compiler for better performance
- **ESM-only**: CommonJS is no longer supported (removed dual module format)
- **Sanity Studio v5 required**: The plugin now requires Sanity Studio v5 as the baseline
- **React 19 required**: Updated to support React 19.2+
- **Stricter TypeScript**: Updated type definitions with improved type safety
- **Updated dependencies**: All dependencies updated to latest compatible versions

The plugin functionality remains the same, but the new build process and dependencies require these breaking changes for compatibility with the monorepo's tooling and conventions.

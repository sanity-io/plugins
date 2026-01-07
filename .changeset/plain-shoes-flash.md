---
"@sanity/rich-date-input": major
---

Migrate plugin to monorepo with React Compiler support, ESM-only, and Sanity Studio v5 baseline.

## Breaking Changes

- **ESM-only**: This package now ships as ESM-only. CommonJS (CJS) is no longer supported.
- **Sanity Studio v5 baseline**: The minimum required version of Sanity Studio is now v5.
- **React 19**: Peer dependency updated to React 19.2.
- **React Compiler enabled**: The plugin is now compiled with React Compiler for optimized performance.

## Migration Guide

If you're upgrading from v3.x:

1. Ensure your project is using Sanity Studio v5 or later
2. Ensure your project is using React 19.2 or later
3. If using CommonJS, migrate to ESM or use dynamic imports
4. No code changes required - the API remains the same

# sanity-plugin-studio-smartling

## 5.0.1

### Patch Changes

- Updated dependencies [[`eaa6280`](https://github.com/sanity-io/plugins/commit/eaa6280d729f6e3b4436e7b2fc2556b4580e4afe), [`c6e8859`](https://github.com/sanity-io/plugins/commit/c6e88593379d8890246f212fb12916f3b99f78d5)]:
  - sanity-translations-tab@6.1.5

## 5.0.0

### Major Changes

- [#975](https://github.com/sanity-io/plugins/pull/975) [`884332f`](https://github.com/sanity-io/plugins/commit/884332f68b5a1eb808201b79dd1fb53bae07e659) Thanks [@cngonzalez](https://github.com/cngonzalez), [@apennell](https://github.com/apennell), [@stipsan](https://github.com/stipsan), [@arthur-pinner](https://github.com/arthur-pinner), [@KJHeartbreaker](https://github.com/KJHeartbreaker), [@RitaDias](https://github.com/RitaDias)! - Port sanity-plugin-studio-smartling to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The plugin is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
  - **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=14)
  - **styled-components 6.1+ required**: `styled-components` is now a required peer dependency (required by `sanity-translations-tab`)

## [4.3.3](https://github.com/sanity-io/sanity-plugin-studio-smartling/compare/v4.3.2...v4.3.3) (2026-01-07)

### Bug Fixes

- **deps:** Update dependency sanity-translations-tab to v5 ([#35](https://github.com/sanity-io/sanity-plugin-studio-smartling/issues/35)) ([a64c6d8](https://github.com/sanity-io/sanity-plugin-studio-smartling/commit/a64c6d883ccfecacb5ea5adc335b17008bd5db75))

## [4.3.2](https://github.com/sanity-io/sanity-plugin-studio-smartling/compare/v4.3.1...v4.3.2) (2025-12-29)

### Bug Fixes

- update package.json and package-lock.json to support Sanity v5 ([#34](https://github.com/sanity-io/sanity-plugin-studio-smartling/issues/34)) ([9a8eb09](https://github.com/sanity-io/sanity-plugin-studio-smartling/commit/9a8eb0978b27c4b7c848835645e5c8d99d3d07c3))

## [4.3.1](https://github.com/sanity-io/sanity-plugin-studio-smartling/compare/v4.3.0...v4.3.1) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 peer dep ranges ([1e3de60](https://github.com/sanity-io/sanity-plugin-studio-smartling/commit/1e3de60b44d0867bedfb5b91b01c0ee8d6047798))

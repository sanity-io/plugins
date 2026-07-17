# @sanity/hierarchical-document-list

## 3.0.9

### Patch Changes

- [#1596](https://github.com/sanity-io/plugins/pull/1596) [`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.8

## 3.0.8

### Patch Changes

- [#1571](https://github.com/sanity-io/plugins/pull/1571) [`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update tsdown to ^0.22.7 and @sanity/tsdown-config to ^0.14.0

## 3.0.7

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

## 3.0.6

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 3.0.5

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

## 3.0.4

### Patch Changes

- [#1481](https://github.com/sanity-io/plugins/pull/1481) [`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a) Thanks [@stipsan](https://github.com/stipsan)! - Upgrade `@sanity/pkg-utils` to `^10.9.0`, enabling tree-shaking of unused `styled-components` in the published bundle. Tagged template literals are now transpiled to plain call expressions during build, so bundlers can drop styled components this plugin exports but the app doesn't use, reducing bundle size.

## 3.0.3

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 3.0.2

### Patch Changes

- [#1363](https://github.com/sanity-io/plugins/pull/1363) [`f9acf7c`](https://github.com/sanity-io/plugins/commit/f9acf7c0599e63feb30509f7d42ff941a01e2d35) Thanks [@stipsan](https://github.com/stipsan)! - Replace `React.forwardRef` with the React 19 ref-as-prop pattern (internal refactor, no API change)

## 3.0.1

### Patch Changes

- [#1206](https://github.com/sanity-io/plugins/pull/1206) [`989b4f4`](https://github.com/sanity-io/plugins/commit/989b4f49ea29954cc5a2bb072c79f1b44eec25d3) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update sanity monorepo

## 3.0.0

### Major Changes

- [#985](https://github.com/sanity-io/plugins/pull/985) [`dae1385`](https://github.com/sanity-io/plugins/commit/dae13853914458025c244f703ac29bf714b5b2d5) Thanks [@hdoro](https://github.com/hdoro), [@snorrees](https://github.com/snorrees), [@stipsan](https://github.com/stipsan), [@mariuslundgard](https://github.com/mariuslundgard), [@pedrobonamin](https://github.com/pedrobonamin), [@RitaDias](https://github.com/RitaDias), [@tine-krueger](https://github.com/tine-krueger), [@apokaliptis](https://github.com/apokaliptis)! - Port @sanity/hierarchical-document-list to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **react-dnd 16 compatibility fixed**: `@nosferatu500/react-sortable-tree` is upgraded to v5 and declared as a regular dependency instead of being bundled, fixing the Studio crash caused by importing the removed `DragSource`/`DropTarget` APIs from react-dnd 16
  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
  - **react-is peer dependency removed**: `react-is` is no longer required as a peer dependency
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=14)

## [2.1.3](https://github.com/sanity-io/hierarchical-document-list/compare/v2.1.2...v2.1.3) (2025-12-18)

### Bug Fixes

- **deps:** make peer dependencies include sanity 5.x ([#35](https://github.com/sanity-io/hierarchical-document-list/issues/35)) ([d8e3192](https://github.com/sanity-io/hierarchical-document-list/commit/d8e3192adfb6971c9c279d7b3d337c9b6cd933d7))

## [2.1.2](https://github.com/sanity-io/hierarchical-document-list/compare/v2.1.1...v2.1.2) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 peer dep ranges ([5952cab](https://github.com/sanity-io/hierarchical-document-list/commit/5952cab90e46584df92bf1af4adb2720010e1c8a))

## [2.1.1](https://github.com/sanity-io/hierarchical-document-list/compare/v2.1.0...v2.1.1) (2025-03-07)

### Bug Fixes

- **deps:** inline `@nosferatu500/react-sortable-tree` ([78b804a](https://github.com/sanity-io/hierarchical-document-list/commit/78b804a2a79bef520e8d3f552c7a552acb1666a5))

## [2.1.0](https://github.com/sanity-io/hierarchical-document-list/compare/v2.0.1...v2.1.0) (2025-03-07)

### Features

- add react 19 to peer deps ([fb26e2c](https://github.com/sanity-io/hierarchical-document-list/commit/fb26e2ca69be4b0f098520204748f8572a413162))

### Bug Fixes

- correctly calculate tree height ([3b06256](https://github.com/sanity-io/hierarchical-document-list/commit/3b06256392e866b5fcc39b70b5910990321d10d8))

## [2.0.1](https://github.com/sanity-io/hierarchical-document-list/compare/v2.0.0...v2.0.1) (2025-03-07)

### Bug Fixes

- upgrade `@sanity/ui` ([8df02c0](https://github.com/sanity-io/hierarchical-document-list/commit/8df02c05cf9a69254268b307d4a0cc294c3f0a56))

## [2.0.0](https://github.com/sanity-io/hierarchical-document-list/compare/v1.1.0...v2.0.0) (2023-12-04)

### ⚠ BREAKING CHANGES

- migrate to v3 (#15)

### Features

- migrate to v3 ([#15](https://github.com/sanity-io/hierarchical-document-list/issues/15)) ([7e2abb7](https://github.com/sanity-io/hierarchical-document-list/commit/7e2abb7c3eee9c532976ce6e17ce7255b47227fe))

### Bug Fixes

- validates that S and context props are passed as config to createDeskHierarchy ([d781809](https://github.com/sanity-io/hierarchical-document-list/commit/d781809e3e970968254b621078658538188b08ae))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.1.0](https://github.com/sanity-io/hierarchical-document-list/compare/v1.0.0...v1.1.0) (2022-03-18)

### Features

- types are now correctly bundled ([50ecd09](https://github.com/sanity-io/hierarchical-document-list/commit/50ecd0974af5bf09f17ee2e73d64e8db74701e42))

### Bug Fixes

- multiple createDeskHierarchy in a studio now works correctly ([7283c4c](https://github.com/sanity-io/hierarchical-document-list/commit/7283c4c56dad3a845eff93ae112c9b43238cf612))

# @sanity/table

## 3.1.6

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 3.1.5

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

## 3.1.4

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 3.1.3

### Patch Changes

- [#1304](https://github.com/sanity-io/plugins/pull/1304) [`5d2195a`](https://github.com/sanity-io/plugins/commit/5d2195a8b56b1907391a6bfb9cff9ca5448bc9dc) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @sanity/uuid to ^3.0.3

## 3.1.2

### Patch Changes

- [#1054](https://github.com/sanity-io/plugins/pull/1054) [`534d7b9`](https://github.com/sanity-io/plugins/commit/534d7b9b75a2aa62eed47a272c67615f5ab931a6) Thanks [@stipsan](https://github.com/stipsan)! - Fix table preview cell truncation (use the `ellipsis` text-overflow), derive the menu/dialog DOM ids from the input id so multiple table inputs (e.g. arrays of tables) don't collide on duplicate ids, and validate the add row/column count by disabling Confirm and showing a validity message for empty or out-of-range values

## 3.1.1

### Patch Changes

- [#1069](https://github.com/sanity-io/plugins/pull/1069) [`65ecb1b`](https://github.com/sanity-io/plugins/commit/65ecb1b3f724776d7ca7032697e1649dbcf34a28) Thanks [@mehmetyildizdev](https://github.com/mehmetyildizdev)! - Keep the Table menu "Add …" dialog input controlled, silencing the React controlled/uncontrolled input warning

## 3.1.0

### Minor Changes

- [#1068](https://github.com/sanity-io/plugins/pull/1068) [`1bf92b0`](https://github.com/sanity-io/plugins/commit/1bf92b0dff4cc1192fdfb8bf415246ac1d623a05) Thanks [@matthewwyndham](https://github.com/matthewwyndham)! - Add quick "Row" and "Column" buttons to the table input toolbar so a single row or column can be added without opening the menu

## 3.0.0

### Major Changes

- [#973](https://github.com/sanity-io/plugins/pull/973) [`5fc4a71`](https://github.com/sanity-io/plugins/commit/5fc4a719915b8df9df597f6a10fd69ba3f3642f5) Thanks [@stipsan](https://github.com/stipsan)! - Port @sanity/table to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18 || ^19)
  - **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)

## [2.0.1](https://github.com/sanity-io/table/compare/v2.0.0...v2.0.1) (2025-12-29)

### Bug Fixes

- **deps:** allow studio v5 in peer deps ranges ([#56](https://github.com/sanity-io/table/issues/56)) ([79d97da](https://github.com/sanity-io/table/commit/79d97daaa26a64583afde58ee8818af2e7eeefb2))

## [2.0.0](https://github.com/sanity-io/table/compare/v1.1.4...v2.0.0) (2025-09-15)

### ⚠ BREAKING CHANGES

- **deps:** update @sanity/ui to 3.x (#54)

### Features

- **deps:** update @sanity/ui to 3.x ([#54](https://github.com/sanity-io/table/issues/54)) ([8bb3e25](https://github.com/sanity-io/table/commit/8bb3e25b01da99d2e9e6b18dff47ee5240d08c11))

## [1.1.4](https://github.com/sanity-io/table/compare/v1.1.3...v1.1.4) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges + update main.yml ([#53](https://github.com/sanity-io/table/issues/53)) ([877bbc5](https://github.com/sanity-io/table/commit/877bbc54cb1e0a010f6d554175f4c7194f5946e7))

## [1.1.3](https://github.com/sanity-io/table/compare/v1.1.2...v1.1.3) (2024-12-18)

### Bug Fixes

- make react 19 compatible ([#49](https://github.com/sanity-io/table/issues/49)) ([a2e5eff](https://github.com/sanity-io/table/commit/a2e5effbab9fff9feb598685f163b8a1cdb25d24))

## [1.1.2](https://github.com/sanity-io/table/compare/v1.1.1...v1.1.2) (2024-01-17)

### Bug Fixes

- correct config type ([c911c23](https://github.com/sanity-io/table/commit/c911c23cdafb6c6ec659ab4a081c8d76db4536c5))

## [1.1.1](https://github.com/sanity-io/table/compare/v1.1.0...v1.1.1) (2024-01-17)

### Bug Fixes

- pass row type to table component ([35d5457](https://github.com/sanity-io/table/commit/35d545728ad97419ee7cc7b0bb674bc5e8844a85))

## [1.1.0](https://github.com/sanity-io/table/compare/v1.0.1...v1.1.0) (2024-01-12)

### Features

- add configurable row type ([4d19b67](https://github.com/sanity-io/table/commit/4d19b67197a8507aeb6125020020d7467286c7bb))

## [1.0.1](https://github.com/sanity-io/table/compare/v1.0.0...v1.0.1) (2022-11-25)

### Bug Fixes

- **deps:** sanity ^3.0.0 (works with rc.3) ([ba5c124](https://github.com/sanity-io/table/commit/ba5c124daa0dafe66b2755e861ecb91ec3c1a705))
- preview props ([6ab72e7](https://github.com/sanity-io/table/commit/6ab72e76c400d9c1a5c6e073df79bb34e25b1990))

## 1.0.0 (2022-11-20)

### ⚠ BREAKING CHANGES

- Big thanks to the original contributors for their work!
  @rdunk @kMathisBullinger and @davydog187

### Features

- initial Sanity Studio v3 release ([639df1e](https://github.com/sanity-io/table/commit/639df1ee074d6e7b46291c66f49382ee20da62d3))

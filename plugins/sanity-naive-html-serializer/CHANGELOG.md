# sanity-naive-html-serializer

## 5.1.0

### Minor Changes

- [#957](https://github.com/sanity-io/plugins/pull/957) [`310b5fe`](https://github.com/sanity-io/plugins/commit/310b5fe3070eafe89f3cafea48568a3577a3a118) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Support both internationalized array data formats. The serializer, deserializer, and merger now read the language from either the legacy `_key` or the new `language` field (`sanity-plugin-internationalized-array` v5), and write merged translations back in whichever format the source document already uses.

## 5.0.0

### Major Changes

- [#931](https://github.com/sanity-io/plugins/pull/931) [`5a9204f`](https://github.com/sanity-io/plugins/commit/5a9204fcf31f00eb5c96c1368ab21cef088cf8f4) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Port sanity-naive-html-serializer to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:
  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
  - **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)

## [4.1.0](https://github.com/sanity-io/sanity-naive-html-serializer/compare/v4.0.2...v4.1.0) (2026-02-08)

### Features

- i18n array serialization ([#62](https://github.com/sanity-io/sanity-naive-html-serializer/issues/62)) ([174ded7](https://github.com/sanity-io/sanity-naive-html-serializer/commit/174ded7a31948758aaa1897014941c1373970388))

## [4.0.2](https://github.com/sanity-io/sanity-naive-html-serializer/compare/v4.0.1...v4.0.2) (2025-12-29)

### Bug Fixes

- **deps:** allow studio v5 in peer deps ranges ([#92](https://github.com/sanity-io/sanity-naive-html-serializer/issues/92)) ([7e4b4c0](https://github.com/sanity-io/sanity-naive-html-serializer/commit/7e4b4c03565cc33d0ed8d8241b33ad07de97daab))
- **deps:** Update dependency @portabletext/block-tools to v4 ([#89](https://github.com/sanity-io/sanity-naive-html-serializer/issues/89)) ([a277cdd](https://github.com/sanity-io/sanity-naive-html-serializer/commit/a277cddbb6a7b6c1c8d3adb9b91b6990af72d8d3))

## [4.0.1](https://github.com/sanity-io/sanity-naive-html-serializer/compare/v4.0.0...v4.0.1) (2025-11-12)

### Bug Fixes

- **deps:** update sanity monorepo to v4 ([#88](https://github.com/sanity-io/sanity-naive-html-serializer/issues/88)) ([e756db1](https://github.com/sanity-io/sanity-naive-html-serializer/commit/e756db1cb3483a1facada76f84434ef280495b25))

## [4.0.0](https://github.com/sanity-io/sanity-naive-html-serializer/compare/v3.2.0...v4.0.0) (2025-11-03)

### ⚠ BREAKING CHANGES

- Requires Node.js >=18. Updated from @sanity/block-tools to @portabletext/block-tools.

### Miscellaneous Chores

- upgrade to plugin-kit v3 and pkg-utils v8 ([#84](https://github.com/sanity-io/sanity-naive-html-serializer/issues/84)) ([5f1c214](https://github.com/sanity-io/sanity-naive-html-serializer/commit/5f1c214b89873301e8bb0f90878335e508dd47e0))

## [3.2.0](https://github.com/sanity-io/sanity-naive-html-serializer/compare/v3.1.9...v3.2.0) (2025-07-10)

### Features

- **deps:** bump all non-major ([1440591](https://github.com/sanity-io/sanity-naive-html-serializer/commit/14405912cc8adf353bc9a1f1c0e49057e2d4b7f2))

## [3.1.9](https://github.com/sanity-io/sanity-naive-html-serializer/compare/v3.1.8...v3.1.9) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 peer dep ranges ([5b9936a](https://github.com/sanity-io/sanity-naive-html-serializer/commit/5b9936a7b43645b4e98ec6e11155799a4e1d85bb))
- **deps:** update React dependency to v19 ([#78](https://github.com/sanity-io/sanity-naive-html-serializer/issues/78)) ([d3fd193](https://github.com/sanity-io/sanity-naive-html-serializer/commit/d3fd1939c7d3ccccabf321415e936816f5bbefad))
